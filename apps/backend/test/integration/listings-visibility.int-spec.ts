import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestApp, TestApp } from './helpers/app';
import { resetDb } from './helpers/db';
import {
  communityWithGroup,
  createCommunity,
  createListing,
  createUser,
  expectStatus,
  joinCommunity,
} from './helpers/factories';

describe('Listing visibility', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => resetDb(t.prisma));
  afterAll(() => t.close());

  const feed = async (userId: string, query = '') =>
    expectStatus(await t.request('GET', `/listings/paginated${query}`, { as: userId }), 200).body;
  const feedIds = async (userId: string, query = '') =>
    (await feed(userId, query)).data.map((l: { id: string }) => l.id);

  it('shows an unshared listing only to its creator', async () => {
    const creator = await createUser(t);
    const other = await createUser(t);
    const listing = await createListing(t, creator.id);

    expect(await feedIds(creator.id)).toEqual([listing.id]);
    expect(await feedIds(other.id)).toEqual([]);
  });

  it('shows a community listing to members but not to outsiders', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    const outsider = await createUser(t);
    const listing = await createListing(t, owner.id, { communityIds: [community.id] });

    expect(await feedIds(member.id)).toEqual([listing.id]);
    const outsiderFeed = await feed(outsider.id);
    expect(outsiderFeed.data).toEqual([]);
    expect(outsiderFeed.total).toBe(0);
    expect((await t.request('GET', `/listings/${listing.id}`, { as: member.id })).status).toBe(200);
  });

  it('answers 404 (not 403) when an outsider opens a listing', async () => {
    const creator = await createUser(t);
    const outsider = await createUser(t);
    const listing = await createListing(t, creator.id);

    expect((await t.request('GET', `/listings/${listing.id}`, { as: outsider.id })).status).toBe(404);
  });

  it('shows a group listing to group members but not to other community members', async () => {
    const { owner, member, community, group } = await communityWithGroup(t);
    const communityOnly = await createUser(t);
    await joinCommunity(t, communityOnly.id, community);
    const listing = await createListing(t, owner.id, { communityIds: [group.id] });

    expect(await feedIds(member.id)).toEqual([listing.id]);
    expect(await feedIds(communityOnly.id)).toEqual([]);
  });

  it('never widens visibility through search, type or category filters', async () => {
    const { owner, community } = await communityWithGroup(t);
    const outsider = await createUser(t);
    await createListing(t, owner.id, { communityIds: [community.id] }, 'Bohrmaschine');

    expect(await feedIds(outsider.id, '?search=Bohr')).toEqual([]);
    expect(await feedIds(outsider.id, '?types=LEND&categories=TOOLS&search=maschine')).toEqual([]);
  });

  it('filters by own and bookmarked listings and reports isBookmarked', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    const own = await createListing(t, member.id, { communityIds: [community.id] }, 'Eigenes Inserat');
    const other = await createListing(t, owner.id, { communityIds: [community.id] }, 'Fremdes Inserat');
    expectStatus(await t.request('POST', `/listings/${other.id}/bookmark`, { as: member.id }), 201);

    expect(await feedIds(member.id, '?myListings=true')).toEqual([own.id]);
    expect(await feedIds(member.id, '?bookmarked=true')).toEqual([other.id]);
    const byId = Object.fromEntries((await feed(member.id)).data.map((l: any) => [l.id, l.isBookmarked]));
    expect(byId).toEqual({ [own.id]: false, [other.id]: true });
    const detail = await t.request('GET', `/listings/${other.id}`, { as: member.id });
    expect(detail.body.isBookmarked).toBe(true);
  });

  it('shows non-owners only the visibility entries of their own memberships', async () => {
    const { owner, member, community, group } = await communityWithGroup(t);
    const second = await createCommunity(t, owner.id, 'Second');
    const listing = await createListing(t, owner.id, { communityIds: [community.id, second.id, group.id] });
    const communityOnly = await createUser(t);
    await joinCommunity(t, communityOnly.id, community);

    const shownTo = async (userId: string) =>
      (await t.request('GET', `/listings/${listing.id}`, { as: userId })).body.visibility.length;
    expect(await shownTo(owner.id)).toBe(3);
    expect(await shownTo(member.id)).toBe(2);
    expect(await shownTo(communityOnly.id)).toBe(1);
  });

  it('hides contact details from the owner but shows them to other viewers', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    await t.prisma.user.update({ where: { id: owner.id }, data: { phoneNumber: '+41790000000' } });
    const listing = await createListing(t, owner.id, { communityIds: [community.id] });

    const asOwner = await t.request('GET', `/listings/${listing.id}`, { as: owner.id });
    const asMember = await t.request('GET', `/listings/${listing.id}`, { as: member.id });
    expect(asOwner.body.creator.phoneNumber).toBeNull();
    expect(asMember.body.creator.phoneNumber).toBe('+41790000000');
  });

  it('hides a deleted listing from everyone, including its creator', async () => {
    const creator = await createUser(t);
    const listing = await createListing(t, creator.id);
    expectStatus(await t.request('DELETE', `/listings/${listing.id}`, { as: creator.id }), 204);

    expect((await t.request('GET', `/listings/${listing.id}`, { as: creator.id })).status).toBe(404);
    expect(await feedIds(creator.id)).toEqual([]);
  });

  it('hides listings shared only with a deleted community', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    const listing = await createListing(t, member.id, { communityIds: [community.id] });
    expectStatus(await t.request('DELETE', `/communities/${community.id}`, { as: owner.id }), 204);

    expect(await feedIds(owner.id)).toEqual([]);
    expect(await feedIds(member.id)).toEqual([listing.id]);
  });

  it('caps the page size at 100', async () => {
    const user = await createUser(t);
    expect((await t.request('GET', '/listings/paginated?limit=101', { as: user.id })).status).toBe(400);
  });

  it('answers 400 for a malformed listing id', async () => {
    const user = await createUser(t);
    expect((await t.request('GET', '/listings/not-a-uuid', { as: user.id })).status).toBe(400);
  });
});
