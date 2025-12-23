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
import { CommunitiesService } from './communities.service';
import { MembershipService } from './membership.service';
import { CreateCommunityDto, UpdateCommunityDto } from './dto';

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
    return this.communitiesService.findAllForUser(user.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.communitiesService.findOne(id, user.id);
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

  @Post('join')
  async join(@CurrentUser() user, @Query('token') token: string) {
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
}
