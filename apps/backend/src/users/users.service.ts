import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { revokeCommunityMembership } from '../communities/membership.cascade';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        homeAddress: true,
        phoneNumber: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        homeAddress: true,
        phoneNumber: true,
        preferredLanguage: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.$transaction(async (tx) => {
      // Leave every foreign community the regular way: shares go, owned groups
      // pass to the community owner. Communities the user owns stay as they are.
      const memberships = await tx.communityMember.findMany({
        where: { userId: id, community: { ownerId: { not: id } } },
        select: { community: { select: { id: true, ownerId: true } } },
      });
      for (const { community } of memberships) {
        await revokeCommunityMembership(tx, community, id);
      }

      const now = new Date();
      await tx.listingVisibility.deleteMany({ where: { listing: { creatorId: id } } });
      await tx.listing.updateMany({ where: { creatorId: id, deletedAt: null }, data: { deletedAt: now } });
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.ssoAccount.deleteMany({ where: { userId: id } });
      await tx.communityMember.deleteMany({ where: { userId: id } });
      await tx.groupMember.deleteMany({ where: { userId: id } });
      await tx.user.update({ where: { id }, data: { deletedAt: now } });
    }, { timeout: 15_000 }); // one cascade per community; pooled connections can be slow
  }

  async exportData(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        ssoAccounts: true,
        ownedCommunities: true,
        communityMemberships: {
          include: {
            community: true,
          },
        },
        ownedGroups: true,
        groupMemberships: {
          include: {
            group: true,
          },
        },
        listings: {
          where: { deletedAt: null },
          include: {
            images: true,
            visibility: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
