import { Module } from '@nestjs/common';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { MembershipService } from './membership.service';

@Module({
  controllers: [CommunitiesController],
  providers: [CommunitiesService, MembershipService],
})
export class CommunitiesModule {}
