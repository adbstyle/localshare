import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { GroupsService } from './groups.service';
import { GroupMembershipService } from './group-membership.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';

// DTO Transform: Map Prisma's listingVisibility to API's sharedListings
function transformGroupDto(group: any) {
  if (!group) return group;

  const { _count, ...rest } = group;
  return {
    ...rest,
    _count: {
      members: _count?.members || 0,
      sharedListings: _count?.listingVisibility || 0,
    },
  };
}

@Controller('groups')
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private membershipService: GroupMembershipService,
  ) {}

  @Post()
  async create(@CurrentUser() user, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user,
    @Query('communityId', new ParseUUIDPipe({ optional: true })) communityId?: string,
  ) {
    const groups = await this.groupsService.findAllForUser(user.id, communityId);
    return groups.map(transformGroupDto);
  }

  @Get(':id')
  async findOne(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    const group = await this.groupsService.findOne(id, user.id);
    return transformGroupDto(group);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    await this.groupsService.delete(id, user.id);
  }

  @Public()
  @Get('preview/:token')
  async getPreview(@Param('token', ParseUUIDPipe) token: string) {
    return this.groupsService.getPreviewByToken(token);
  }

  @Post('join')
  async join(@CurrentUser() user, @Query('token', ParseUUIDPipe) token: string) {
    return this.membershipService.joinGroup(user.id, token);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    await this.membershipService.leaveGroup(user.id, id);
  }

  @Post(':id/refresh-invite')
  async refreshInvite(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.refreshInviteToken(id, user.id);
  }

  @Get(':id/members')
  async getMembers(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.getMembers(id, user.id);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser() user,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    await this.membershipService.removeMember(user.id, id, memberId);
  }
}
