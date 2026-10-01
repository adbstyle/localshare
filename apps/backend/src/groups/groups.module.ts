import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupMembershipService } from './group-membership.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, GroupMembershipService],
})
export class GroupsModule {}
