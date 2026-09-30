import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestApp, TestApp } from './helpers/app';
import { resetDb } from './helpers/db';
import {
  communityWithGroup,
  createCommunity,
  createGroup,
  createListing,
  createUser,
  expectStatus,
  joinCommunity,
  joinGroup,
} from './helpers/factories';

describe('Membership cascades', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => resetDb(t.prisma));
  afterAll(() => t.close());

  const canSee = async (userId: string, listingId: string) =>
    (await t.request('GET', `/listings/${listingId}`, { as: userId })).status === 200;

  /** member shares a listing with the group; a third user in the group should lose sight of it. */
  async function groupShareSetup() {
    const { owner, member, community, group } = await communityWithGroup(t);
    const watcher = await createUser(t, 'Watcher');
    await joinCommunity(t, watcher.id, community);
    await joinGroup(t, watcher.id, group);
    const listing = await createListing(t, member.id, { communityIds: [community.id], groupIds: [group.id] });
    return { owner, member, watcher, community, group, listing };
  }

  it('hides the listings of a user who leaves, also in the groups of the community', async () => {
    const { member, watcher, community, listing } = await groupShareSetup();
    expect(await canSee(watcher.id, listing.id)).toBe(true);

    expectStatus(await t.request('DELETE', `/communities/${community.id}/leave`, { as: member.id }), 204);

    expect(await canSee(watcher.id, listing.id)).toBe(false);
  });

  it('hides the listings of a removed member, also in the groups of the community', async () => {
    const { owner, member, watcher, community, listing } = await groupShareSetup();

    expectStatus(
      await t.request('DELETE', `/communities/${community.id}/members/${member.id}`, { as: owner.id }),
      204,
    );

    expect(await canSee(watcher.id, listing.id)).toBe(false);
  });

  it('removes a user who leaves a community from its groups', async () => {
    const { member, community, group } = await communityWithGroup(t);

    expectStatus(await t.request('DELETE', `/communities/${community.id}/leave`, { as: member.id }), 204);

    expect((await t.request('GET', `/groups/${group.id}`, { as: member.id })).status).not.toBe(200);
  });

  it('transfers the groups of a leaving user to the community owner', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    const ownGroup = await createGroup(t, member.id, community.id, 'Gruppe des Mitglieds');

    expectStatus(await t.request('DELETE', `/communities/${community.id}/leave`, { as: member.id }), 204);

    const group = expectStatus(await t.request('GET', `/groups/${ownGroup.id}`, { as: owner.id }), 200).body;
    expect(group.ownerId).toBe(owner.id);
  });

  it('drops group shares when the community is deleted', async () => {
    const { owner, member, community, group } = await communityWithGroup(t);
    const listing = await createListing(t, member.id, { groupIds: [group.id] });

    expectStatus(await t.request('DELETE', `/communities/${community.id}`, { as: owner.id }), 204);

    const detail = expectStatus(await t.request('GET', `/listings/${listing.id}`, { as: member.id }), 200).body;
    expect(detail.visibility).toEqual([]);
  });

  it('transfers the groups of a removed member to the community owner', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    const ownGroup = await createGroup(t, member.id, community.id, 'Gruppe des Mitglieds');

    expectStatus(
      await t.request('DELETE', `/communities/${community.id}/members/${member.id}`, { as: owner.id }),
      204,
    );

    const group = expectStatus(await t.request('GET', `/groups/${ownGroup.id}`, { as: owner.id }), 200).body;
    expect(group.viewer.role).toBe('owner');
  });

  it('drops shares when a group is deleted', async () => {
    const { owner, member, group } = await communityWithGroup(t);
    await createListing(t, owner.id, { groupIds: [group.id] });

    expectStatus(await t.request('DELETE', `/groups/${group.id}`, { as: owner.id }), 204);

    expect(await t.prisma.listingVisibility.count()).toBe(0);
    expect((await t.request('GET', `/groups/${group.id}`, { as: member.id })).status).toBe(404);
  });

  it('removes shares with a group only when leaving that group', async () => {
    const { member, watcher, community, group, listing } = await groupShareSetup();

    expectStatus(await t.request('DELETE', `/groups/${group.id}/leave`, { as: member.id }), 204);

    const rows = await t.prisma.listingVisibility.findMany({ where: { listingId: listing.id } });
    expect(rows.map((r) => r.communityId)).toEqual([community.id]);
    expect(await canSee(watcher.id, listing.id)).toBe(true);
  });

  describe('account deletion', () => {
    it('hides the listings and invalidates the token', async () => {
      const { member, watcher, listing } = await groupShareSetup();

      expectStatus(await t.request('DELETE', '/users/me', { as: member.id }), 204);

      expect(await canSee(watcher.id, listing.id)).toBe(false);
      expect((await t.request('GET', '/auth/me', { as: member.id })).status).toBe(401);
    });

    it('transfers groups in foreign communities to the community owner', async () => {
      const owner = await createUser(t, 'Owner');
      const member = await createUser(t, 'Member');
      const community = await createCommunity(t, owner.id);
      await joinCommunity(t, member.id, community);
      const group = await createGroup(t, member.id, community.id);

      expectStatus(await t.request('DELETE', '/users/me', { as: member.id }), 204);

      const stored = await t.prisma.group.findUniqueOrThrow({ where: { id: group.id } });
      expect(stored.ownerId).toBe(owner.id);
    });
  });
});
