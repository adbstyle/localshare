import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestApp, TestApp } from './helpers/app';
import { resetDb } from './helpers/db';
import { createCommunity, createUser, expectStatus, joinCommunity } from './helpers/factories';

describe('Communities', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => resetDb(t.prisma));
  afterAll(() => t.close());

  async function setup() {
    const owner = await createUser(t, 'Owner');
    const member = await createUser(t, 'Member');
    const outsider = await createUser(t, 'Outsider');
    const community = await createCommunity(t, owner.id);
    await joinCommunity(t, member.id, community);
    return { owner, member, outsider, community };
  }

  it('lists members with the owner first', async () => {
    const { owner, member, community } = await setup();
    const response = expectStatus(await t.request('GET', `/communities/${community.id}/members`, { as: member.id }), 200);

    expect(response.body.map((m: any) => [m.id, m.role])).toEqual([
      [owner.id, 'owner'],
      [member.id, 'member'],
    ]);
  });

  it('answers 404 when an outsider opens a community or its members', async () => {
    const { outsider, community } = await setup();

    expect((await t.request('GET', `/communities/${community.id}`, { as: outsider.id })).status).toBe(404);
    expect((await t.request('GET', `/communities/${community.id}/members`, { as: outsider.id })).status).toBe(404);
  });

  it('lets only the owner edit, refresh the invite and delete', async () => {
    const { owner, member, community } = await setup();
    const path = `/communities/${community.id}`;

    expect((await t.request('PATCH', path, { as: member.id, body: { name: 'Gekapert' } })).status).toBe(403);
    expect((await t.request('POST', `${path}/refresh-invite`, { as: member.id })).status).toBe(403);
    expect((await t.request('DELETE', path, { as: member.id })).status).toBe(403);

    expect((await t.request('PATCH', path, { as: owner.id, body: { name: 'Umbenannt' } })).status).toBe(200);
    expect((await t.request('POST', `${path}/refresh-invite`, { as: owner.id })).status).toBe(201);
    expect((await t.request('DELETE', path, { as: owner.id })).status).toBe(204);
  });

  it('answers 404 for owner actions by an outsider', async () => {
    const { outsider, community } = await setup();

    expect(
      (await t.request('PATCH', `/communities/${community.id}`, { as: outsider.id, body: { name: 'Gekapert' } })).status,
    ).toBe(404);
  });

  it('lets only the owner remove members, never themselves', async () => {
    const { owner, member, community } = await setup();
    const path = `/communities/${community.id}/members`;

    expect((await t.request('DELETE', `${path}/${owner.id}`, { as: member.id })).status).toBe(403);
    expect((await t.request('DELETE', `${path}/${owner.id}`, { as: owner.id })).status).toBe(400);
    expect((await t.request('DELETE', `${path}/${member.id}`, { as: owner.id })).status).toBe(204);
  });

  it('answers a repeated join with 409 and a bad token with 404', async () => {
    const { member, community } = await setup();

    const again = await t.request('POST', `/communities/join/${community.inviteToken}`, { as: member.id });
    expect(again.status).toBe(409);
    expect(again.body.alreadyMember).toBe(true);
    const unknownToken = '00000000-0000-4000-8000-000000000000';
    expect((await t.request('POST', `/communities/join/${unknownToken}`, { as: member.id })).status).toBe(404);
  });

  it('answers two parallel joins with one 201 and one 409', async () => {
    const { community } = await setup();
    const newcomer = await createUser(t);
    const join = () => t.request('POST', `/communities/join/${community.inviteToken}`, { as: newcomer.id });

    const statuses = (await Promise.all([join(), join()])).map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
  });

  it('tells each viewer what they may do', async () => {
    const { owner, member, community } = await setup();
    const viewerOf = async (userId: string) =>
      (await t.request('GET', `/communities/${community.id}`, { as: userId })).body.viewer;

    expect(await viewerOf(owner.id)).toEqual({
      role: 'owner',
      canEdit: true,
      canDelete: true,
      canManageMembers: true,
      canLeave: false,
    });
    expect(await viewerOf(member.id)).toEqual({
      role: 'member',
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
      canLeave: true,
    });
  });

  it('hides the preview of a deleted community', async () => {
    const { owner, community } = await setup();
    expectStatus(await t.request('DELETE', `/communities/${community.id}`, { as: owner.id }), 204);

    expect((await t.request('GET', `/communities/preview/${community.inviteToken}`)).status).toBe(404);
  });

  it('does not let the owner leave', async () => {
    const { owner, community } = await setup();
    expect((await t.request('DELETE', `/communities/${community.id}/leave`, { as: owner.id })).status).toBe(403);
  });

  it('answers 404 when an outsider tries to leave', async () => {
    const { outsider, community } = await setup();
    expect((await t.request('DELETE', `/communities/${community.id}/leave`, { as: outsider.id })).status).toBe(404);
  });
});
