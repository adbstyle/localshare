import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ImageService } from './image.service';
import { ImageStorage } from './storage';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, ImageService, ImageStorage],
})
export class ListingsModule {}
