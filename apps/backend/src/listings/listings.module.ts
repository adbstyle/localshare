import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { VisibilityService } from './visibility.service';
import { ImageService } from './image.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ListingsController],
  providers: [ListingsService, VisibilityService, ImageService],
  exports: [ListingsService, VisibilityService, ImageService],
})
export class ListingsModule {}
