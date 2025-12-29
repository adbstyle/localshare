import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CommunitiesService } from './communities.service';
import { MembershipService } from './membership.service';
import { CreateCommunityDto, UpdateCommunityDto } from './dto';

// DTO Transform: Map Prisma's listingVisibility to API's sharedListings
function transformCommunityDto(community: any) {
  if (!community) return community;

  const { _count, ...rest } = community;
  return {
    ...rest,
    _count: {
      members: _count?.members || 0,
      sharedListings: _count?.listingVisibility || 0,
    },
  };
}

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunitiesController {
  constructor(
    private communitiesService: CommunitiesService,
    private membershipService: MembershipService,
  ) {}

  @Post()
  async create(@CurrentUser() user, @Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user) {
    const communities = await this.communitiesService.findAllForUser(user.id);
    return communities.map(transformCommunityDto);
  }

  @Public()
  @Get('preview/:token')
  async getPreview(@Param('token') token: string) {
    return this.communitiesService.getPreviewByToken(token);
  }

  @Get(':id')
  async findOne(@CurrentUser() user, @Param('id') id: string) {
    const community = await this.communitiesService.findOne(id, user.id);
    return transformCommunityDto(community);
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityDto) {
    return this.communitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.communitiesService.delete(id);
  }

  @Post('join/:token')
  async join(@CurrentUser() user, @Param('token') token: string) {
    return this.membershipService.joinCommunity(user.id, token);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@CurrentUser() user, @Param('id') id: string) {
    await this.membershipService.leaveCommunity(user.id, id);
  }

  @Post(':id/refresh-invite')
  @UseGuards(OwnershipGuard)
  async refreshInvite(@Param('id') id: string) {
    return this.communitiesService.refreshInviteToken(id);
  }

  @Get(':id/members')
  async getMembers(@CurrentUser() user, @Param('id') id: string) {
    return this.communitiesService.getMembers(id, user.id);
  }
}
