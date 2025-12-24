import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { GroupMembershipService } from './group-membership.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private membershipService: GroupMembershipService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.create(user.id, dto.communityId, dto);
  }

  @Get()
  async findAll(@CurrentUser() user) {
    return this.groupsService.findAllForUser(user.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.groupsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.groupsService.delete(id);
  }

  @Post('join')
  async join(@CurrentUser() user, @Query('token') token: string) {
    return this.membershipService.joinGroup(user.id, token);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@CurrentUser() user, @Param('id') id: string) {
    await this.membershipService.leaveGroup(user.id, id);
  }

  @Post(':id/refresh-invite')
  @UseGuards(OwnershipGuard)
  async refreshInvite(@Param('id') id: string) {
    return this.groupsService.refreshInviteToken(id);
  }

  @Get(':id/members')
  async getMembers(@CurrentUser() user, @Param('id') id: string) {
    return this.groupsService.getMembers(id, user.id);
  }
}
