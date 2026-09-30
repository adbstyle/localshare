import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { ApiResponse, TestApp } from './app';

// Only users are written straight to the DB (there is no signup API); every
// other entity goes through HTTP so the tests exercise the real rules.

export function expectStatus(response: ApiResponse, status: number): ApiResponse {
  if (response.status !== status) {
    throw new Error(`Expected ${status}, got ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return response;
}

export async function createUser(t: TestApp, firstName = 'Test'): Promise<{ id: string }> {
  return t.prisma.user.create({
    data: { email: `${randomUUID()}@test.local`, firstName, lastName: 'User' },
    select: { id: true },
  });
}

export async function createCommunity(t: TestApp, ownerId: string, name = 'Community') {
  const response = await t.request('POST', '/communities', { as: ownerId, body: { name } });
  return expectStatus(response, 201).body as { id: string; inviteToken: string };
}

export async function joinCommunity(t: TestApp, userId: string, community: { inviteToken: string }) {
  const response = await t.request('POST', `/communities/join/${community.inviteToken}`, { as: userId });
  expectStatus(response, 201);
}

export async function createGroup(t: TestApp, ownerId: string, communityId: string, name = 'Group') {
  const response = await t.request('POST', '/groups', { as: ownerId, body: { name, communityId } });
  return expectStatus(response, 201).body as { id: string; inviteToken: string };
}

export async function joinGroup(t: TestApp, userId: string, group: { inviteToken: string }) {
  const response = await t.request('POST', `/groups/join?token=${group.inviteToken}`, { as: userId });
  expectStatus(response, 201);
}

export async function createListing(
  t: TestApp,
  userId: string,
  share: { communityIds?: string[]; groupIds?: string[] } = {},
  title = 'Bohrmaschine',
) {
  const body = { title, type: 'LEND', category: 'TOOLS', ...share };
  const response = await t.request('POST', '/listings', { as: userId, body });
  return expectStatus(response, 201).body as { id: string };
}

export async function imageForm(count: number): Promise<FormData> {
  const form = new FormData();
  for (let i = 0; i < count; i++) {
    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 40 * i, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
    form.append('images', new Blob([new Uint8Array(png)], { type: 'image/png' }), `image-${i}.png`);
  }
  return form;
}

/** Community with an owner, a second member and a group both belong to. */
export async function communityWithGroup(t: TestApp) {
  const owner = await createUser(t, 'Owner');
  const member = await createUser(t, 'Member');
  const community = await createCommunity(t, owner.id);
  await joinCommunity(t, member.id, community);
  const group = await createGroup(t, owner.id, community.id);
  await joinGroup(t, member.id, group);
  return { owner, member, community, group };
}
