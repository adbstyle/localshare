import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupMembershipService } from './group-membership.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupMembershipService],
  exports: [GroupsService, GroupMembershipService],
})
export class GroupsModule {}
