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

// Groups are communities with a parent, one level deep.
describe('Community hierarchy', () => {
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

    const response = await t.request('POST', '/communities', {
      as: outsider.id,
      body: { name: 'Fremdgruppe', parentId: community.id },
    });
    expect(response.status).toBe(404);
  });

  it('refuses a group inside a group', async () => {
    const { owner, group } = await communityWithGroup(t);

    const response = await t.request('POST', '/communities', {
      as: owner.id,
      body: { name: 'Untergruppe', parentId: group.id },
    });
    expect(response.status).toBe(400);
  });

  it('joins the parent community when joining a group', async () => {
    const owner = await createUser(t);
    const newcomer = await createUser(t);
    const community = await createCommunity(t, owner.id);
    const group = await createGroup(t, owner.id, community.id);

    await joinGroup(t, newcomer.id, group);

    expect((await t.request('GET', `/communities/${community.id}`, { as: newcomer.id })).status).toBe(200);
    const preview = await t.request('GET', `/communities/preview/${group.inviteToken}`);
    expect(preview.body.parent).toEqual({ id: community.id, name: 'Community' });
  });

  it('refuses to join a group of a deleted community', async () => {
    const { owner, community, group } = await communityWithGroup(t);
    const newcomer = await createUser(t);
    expectStatus(await t.request('DELETE', `/communities/${community.id}`, { as: owner.id }), 204);

    expect((await t.request('POST', `/communities/join/${group.inviteToken}`, { as: newcomer.id })).status).toBe(404);
    expect((await t.request('GET', `/communities/preview/${group.inviteToken}`)).status).toBe(404);
  });

  it('lists communities and groups of the user flat, groups with their parent', async () => {
    const { owner, member, community, group } = await communityWithGroup(t);
    await createGroup(t, owner.id, community.id, 'Nur Owner');

    const list = expectStatus(await t.request('GET', '/communities', { as: member.id }), 200).body;
    const byId = Object.fromEntries(list.map((c: any) => [c.id, c.parent?.id ?? null]));
    expect(byId).toEqual({ [community.id]: null, [group.id]: community.id });
  });

  it('keeps the community membership when leaving only a group', async () => {
    const { member, community, group } = await communityWithGroup(t);

    expectStatus(await t.request('DELETE', `/communities/${group.id}/leave`, { as: member.id }), 204);

    expect((await t.request('GET', `/communities/${group.id}`, { as: member.id })).status).toBe(404);
    expect((await t.request('GET', `/communities/${community.id}`, { as: member.id })).status).toBe(200);
  });

  it('lets only the group owner remove members', async () => {
    const { owner, member, community, group } = await communityWithGroup(t);
    const third = await createUser(t);
    await joinCommunity(t, third.id, community);
    await joinGroup(t, third.id, group);
    const path = `/communities/${group.id}/members`;

    expect((await t.request('DELETE', `${path}/${third.id}`, { as: member.id })).status).toBe(403);
    expect((await t.request('DELETE', `${path}/${third.id}`, { as: owner.id })).status).toBe(204);
  });
});
