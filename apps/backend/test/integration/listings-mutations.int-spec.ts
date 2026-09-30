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
  imageForm,
} from './helpers/factories';

describe('Listing mutations', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => resetDb(t.prisma));
  afterAll(() => t.close());

  const listingBody = (share: object) => ({ title: 'Velo zu leihen', type: 'LEND', category: 'SPORTS', ...share });

  it('rejects sharing with a community or group the user is not a member of', async () => {
    const stranger = await createUser(t);
    const foreignCommunity = await createCommunity(t, stranger.id, 'Foreign');
    const foreignGroup = await createGroup(t, stranger.id, foreignCommunity.id);
    const user = await createUser(t);

    const toCommunity = await t.request('POST', '/listings', {
      as: user.id,
      body: listingBody({ communityIds: [foreignCommunity.id] }),
    });
    const toGroup = await t.request('POST', '/listings', {
      as: user.id,
      body: listingBody({ communityIds: [foreignGroup.id] }),
    });

    expect(toCommunity.status).toBe(403);
    expect(toGroup.status).toBe(403);
    expect(await t.prisma.listing.count()).toBe(0);
  });

  it('rejects sharing an existing listing into a foreign community on update', async () => {
    const stranger = await createUser(t);
    const foreign = await createCommunity(t, stranger.id, 'Foreign');
    const user = await createUser(t);
    const listing = await createListing(t, user.id);

    const response = await t.request('PATCH', `/listings/${listing.id}`, {
      as: user.id,
      body: { communityIds: [foreign.id] },
    });

    expect(response.status).toBe(403);
    expect(await t.prisma.listingVisibility.count()).toBe(0);
  });

  it('stores duplicate share targets once', async () => {
    const { owner, community } = await communityWithGroup(t);
    await createListing(t, owner.id, { communityIds: [community.id, community.id] });

    expect(await t.prisma.listingVisibility.count()).toBe(1);
  });

  it('replaces the whole visibility set on update', async () => {
    const { owner, community, group } = await communityWithGroup(t);
    const listing = await createListing(t, owner.id, { communityIds: [community.id] });

    expectStatus(
      await t.request('PATCH', `/listings/${listing.id}`, { as: owner.id, body: { communityIds: [group.id] } }),
      200,
    );

    const rows = await t.prisma.listingVisibility.findMany({ select: { communityId: true } });
    expect(rows).toEqual([{ communityId: group.id }]);
  });

  it('forbids a viewer who is not the owner to change or delete the listing', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    const listing = await createListing(t, owner.id, { communityIds: [community.id] });

    expect(
      (await t.request('PATCH', `/listings/${listing.id}`, { as: member.id, body: { title: 'Gekapert' } })).status,
    ).toBe(403);
    expect((await t.request('DELETE', `/listings/${listing.id}`, { as: member.id })).status).toBe(403);
  });

  it('answers 404 when an outsider tries to change a listing', async () => {
    const owner = await createUser(t);
    const outsider = await createUser(t);
    const listing = await createListing(t, owner.id);

    expect(
      (await t.request('PATCH', `/listings/${listing.id}`, { as: outsider.id, body: { title: 'Gekapert' } })).status,
    ).toBe(404);
  });

  it('answers 404 when bookmarking a listing the user cannot see', async () => {
    const owner = await createUser(t);
    const outsider = await createUser(t);
    const listing = await createListing(t, owner.id);

    expect((await t.request('POST', `/listings/${listing.id}/bookmark`, { as: outsider.id })).status).toBe(404);
  });

  it('does not let the owner bookmark their own listing', async () => {
    const owner = await createUser(t);
    const listing = await createListing(t, owner.id);

    expect((await t.request('POST', `/listings/${listing.id}/bookmark`, { as: owner.id })).status).toBe(403);
  });

  it('tells owner and other viewers what they may do', async () => {
    const { owner, member, community } = await communityWithGroup(t);
    const listing = await createListing(t, owner.id, { communityIds: [community.id] });
    const viewerOf = async (userId: string) =>
      (await t.request('GET', `/listings/${listing.id}`, { as: userId })).body.viewer;

    expect(await viewerOf(owner.id)).toEqual({ isOwner: true, canEdit: true, canBookmark: false });
    expect(await viewerOf(member.id)).toEqual({ isOwner: false, canEdit: false, canBookmark: true });
    const feed = await t.request('GET', '/listings/paginated', { as: member.id });
    expect(feed.body.data[0].viewer.canBookmark).toBe(true);
  });

  describe('images', () => {
    const upload = async (userId: string, listingId: string, count: number) =>
      t.request('POST', `/listings/${listingId}/images`, { as: userId, body: await imageForm(count) });

    it('keeps exactly one cover and promotes the next image when the cover is deleted', async () => {
      const owner = await createUser(t);
      const listing = await createListing(t, owner.id);
      const uploaded = expectStatus(await upload(owner.id, listing.id, 2), 201).body.images;
      const cover = uploaded.find((img: any) => img.isCover);

      expect(uploaded.filter((img: any) => img.isCover)).toHaveLength(1);
      expect(uploaded[0].url).toMatch(/^\/uploads\/listings\/.+\.webp$/);
      const after = await t.request('DELETE', `/listings/${listing.id}/images/${cover.id}`, { as: owner.id });
      expect(after.body.images).toHaveLength(1);
      expect(after.body.images[0].isCover).toBe(true);
    });

    it('answers 400 for a fourth image', async () => {
      const owner = await createUser(t);
      const listing = await createListing(t, owner.id);
      expectStatus(await upload(owner.id, listing.id, 3), 201);

      expect((await upload(owner.id, listing.id, 1)).status).toBe(400);
    });

    it("refuses to delete another listing's image", async () => {
      const owner = await createUser(t);
      const first = await createListing(t, owner.id, {}, 'Erstes Inserat');
      const second = await createListing(t, owner.id, {}, 'Zweites Inserat');
      const [image] = expectStatus(await upload(owner.id, first.id, 1), 201).body.images;

      const response = await t.request('DELETE', `/listings/${second.id}/images/${image.id}`, { as: owner.id });
      expect(response.status).toBe(404);
    });
  });
});
