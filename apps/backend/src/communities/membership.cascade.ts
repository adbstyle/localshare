import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { withGroups } from '../access/access.where';

// Every way a membership ends (leave, removal, deletion of a community/group or
// an account) goes through these functions, so the side effects stay consistent.
// For a group, withGroups() is just the group itself.

type Tx = Prisma.TransactionClient;

/**
 * User leaves or is removed from a community or group: their listings are no
 * longer shared there (a community includes its groups), groups they own pass
 * to the community owner, and they lose the memberships.
 */
export async function revokeMembership(
  tx: Tx,
  community: { id: string; ownerId: string },
  userId: string,
): Promise<void> {
  const scope = withGroups(community.id);
  await tx.listingVisibility.deleteMany({ where: { listing: { creatorId: userId }, community: scope } });
  await transferOwnedGroups(tx, community, userId);
  await tx.communityMember.deleteMany({ where: { userId, community: scope } });
}

async function transferOwnedGroups(
  tx: Tx,
  community: { id: string; ownerId: string },
  userId: string,
): Promise<void> {
  const owned = await tx.community.findMany({
    where: { parentId: community.id, ownerId: userId, deletedAt: null },
    select: { id: true },
  });
  if (owned.length === 0) return;

  const groupIds = owned.map((g) => g.id);
  await tx.community.updateMany({ where: { id: { in: groupIds } }, data: { ownerId: community.ownerId } });
  await tx.communityMember.createMany({
    data: groupIds.map((communityId) => ({ communityId, userId: community.ownerId })),
    skipDuplicates: true,
  });
}

/** Soft-deletes a community with its groups and drops all memberships and shares. */
export function softDeleteCommunity(prisma: PrismaService, communityId: string) {
  const scope = withGroups(communityId);
  return prisma.$transaction([
    prisma.listingVisibility.deleteMany({ where: { community: scope } }),
    prisma.communityMember.deleteMany({ where: { community: scope } }),
    prisma.community.updateMany({ where: { ...scope, deletedAt: null }, data: { deletedAt: new Date() } }),
  ]);
}
