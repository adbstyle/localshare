import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

// Every way a membership ends (leave, removal, deletion of community/group or
// account) goes through these functions, so the side effects stay consistent.

type Tx = Prisma.TransactionClient;

/**
 * User leaves or is removed from a community: their listings are no longer
 * shared there or in its groups, groups they own pass to the community owner,
 * and they lose all memberships inside the community.
 */
export async function revokeCommunityMembership(
  tx: Tx,
  community: { id: string; ownerId: string },
  userId: string,
): Promise<void> {
  await tx.listingVisibility.deleteMany({
    where: {
      listing: { creatorId: userId },
      OR: [{ communityId: community.id }, { group: { communityId: community.id } }],
    },
  });
  await transferOwnedGroups(tx, community, userId);
  await tx.groupMember.deleteMany({ where: { userId, group: { communityId: community.id } } });
  await tx.communityMember.deleteMany({ where: { communityId: community.id, userId } });
}

async function transferOwnedGroups(
  tx: Tx,
  community: { id: string; ownerId: string },
  userId: string,
): Promise<void> {
  const owned = await tx.group.findMany({
    where: { communityId: community.id, ownerId: userId, deletedAt: null },
    select: { id: true },
  });
  if (owned.length === 0) return;

  const groupIds = owned.map((g) => g.id);
  await tx.group.updateMany({ where: { id: { in: groupIds } }, data: { ownerId: community.ownerId } });
  await tx.groupMember.createMany({
    data: groupIds.map((groupId) => ({ groupId, userId: community.ownerId })),
    skipDuplicates: true,
  });
}

/** User leaves or is removed from a group: their listings are no longer shared there. */
export async function revokeGroupMembership(tx: Tx, groupId: string, userId: string): Promise<void> {
  await tx.listingVisibility.deleteMany({ where: { groupId, listing: { creatorId: userId } } });
  await tx.groupMember.deleteMany({ where: { groupId, userId } });
}

/** Soft-deletes a community with its groups and drops all memberships and shares. */
export function softDeleteCommunity(prisma: PrismaService, communityId: string) {
  const now = new Date();
  return prisma.$transaction([
    prisma.listingVisibility.deleteMany({
      where: { OR: [{ communityId }, { group: { communityId } }] },
    }),
    prisma.groupMember.deleteMany({ where: { group: { communityId } } }),
    prisma.group.updateMany({ where: { communityId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.communityMember.deleteMany({ where: { communityId } }),
    prisma.community.update({ where: { id: communityId }, data: { deletedAt: now } }),
  ]);
}

export function softDeleteGroup(prisma: PrismaService, groupId: string) {
  return prisma.$transaction([
    prisma.listingVisibility.deleteMany({ where: { groupId } }),
    prisma.groupMember.deleteMany({ where: { groupId } }),
    prisma.group.update({ where: { id: groupId }, data: { deletedAt: new Date() } }),
  ]);
}
