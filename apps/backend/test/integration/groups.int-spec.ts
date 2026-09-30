import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestApp, TestApp } from './helpers/app';
import { resetDb } from './helpers/db';
import {
  communityWithGroup,
  createCommunity,
  createGroup,
  createUser,
  expectStatus,
  joinCommunity,
  joinGroup,
} from './helpers/factories';

describe('Groups', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => resetDb(t.prisma));
  afterAll(() => t.close());

  it('answers 404 when an outsider creates a group in a foreign community', async () => {
    const owner = await createUser(t);
    const outsider = await createUser(t);
    const community = await createCommunity(t, owner.id);

    const response = await t.request('POST', '/groups', {
      as: outsider.id,
      body: { name: 'Fremdgruppe', communityId: community.id },
    });
    expect(response.status).toBe(404);
  });

  it('joins the parent community when joining a group', async () => {
    const owner = await createUser(t);
    const newcomer = await createUser(t);
    const community = await createCommunity(t, owner.id);
    const group = await createGroup(t, owner.id, community.id);

    await joinGroup(t, newcomer.id, group);

    expect((await t.request('GET', `/communities/${community.id}`, { as: newcomer.id })).status).toBe(200);
  });

  it('refuses to join a group of a deleted community', async () => {
    const { owner, community, group } = await communityWithGroup(t);
    const newcomer = await createUser(t);
    expectStatus(await t.request('DELETE', `/communities/${community.id}`, { as: owner.id }), 204);

    const response = await t.request('POST', `/groups/join?token=${group.inviteToken}`, { as: newcomer.id });
    expect(response.status).toBe(404);
  });

  it('lists only my groups, optionally per community', async () => {
    const { owner, member, community, group } = await communityWithGroup(t);
    await createGroup(t, owner.id, community.id, 'Nur Owner');
    const other = await createCommunity(t, member.id, 'Andere');
    const otherGroup = await createGroup(t, member.id, other.id, 'Andere Gruppe');

    const ids = async (query = '') =>
      expectStatus(await t.request('GET', `/groups${query}`, { as: member.id }), 200)
        .body.map((g: { id: string }) => g.id)
        .sort();
    expect(await ids()).toEqual([group.id, otherGroup.id].sort());
    expect(await ids(`?communityId=${community.id}`)).toEqual([group.id]);
  });

  it('lets only the group owner remove members', async () => {
    const { owner, member, community, group } = await communityWithGroup(t);
    const third = await createUser(t);
    await joinCommunity(t, third.id, community);
    await joinGroup(t, third.id, group);
    const path = `/groups/${group.id}/members`;

    expect((await t.request('DELETE', `${path}/${third.id}`, { as: member.id })).status).toBe(403);
    expect((await t.request('DELETE', `${path}/${third.id}`, { as: owner.id })).status).toBe(204);
  });
});
