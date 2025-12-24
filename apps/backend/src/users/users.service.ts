import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { undefinedToNull } from '../common/utils/prisma.utils';

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
    // Convert undefined to null for Prisma (undefined fields are ignored by Prisma)
    const data = undefinedToNull(dto);

    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data,
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
    // Soft delete user
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Hard delete associated data
    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    await this.prisma.ssoAccount.deleteMany({ where: { userId: id } });
    await this.prisma.communityMember.deleteMany({ where: { userId: id } });
    await this.prisma.groupMember.deleteMany({ where: { userId: id } });

    // Soft delete user's listings
    await this.prisma.listing.updateMany({
      where: { creatorId: id },
      data: { deletedAt: new Date() },
    });
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
