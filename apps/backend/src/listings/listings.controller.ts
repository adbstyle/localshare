import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto, FilterListingsDto } from './dto';

@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Post()
  async create(@CurrentUser() user, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.id, dto);
  }

  @Get('paginated')
  async findAllPaginated(@CurrentUser() user, @Query() filters: FilterListingsDto) {
    return this.listingsService.findAllPaginated(user.id, filters);
  }

  @Get(':id')
  async findOne(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    return this.listingsService.findOne(id, user.id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    await this.listingsService.delete(id, user.id);
  }

  @Post(':id/bookmark')
  async toggleBookmark(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    return this.listingsService.toggleBookmark(id, user.id);
  }

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      limits: {
        fileSize: 4 * 1024 * 1024, // 4MB backstop; the frontend downscales to ~0.3-1MB so 3 files fit Vercel's 4.5MB request limit
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|heic)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImages(
    @CurrentUser() user,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.listingsService.uploadImages(id, user.id, files);
  }

  @Delete(':id/images/:imageId')
  async deleteImage(
    @CurrentUser() user,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.listingsService.deleteImage(id, imageId, user.id);
  }

  @Patch(':id/images/:imageId/cover')
  async setCoverImage(
    @CurrentUser() user,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.listingsService.setCoverImage(id, imageId, user.id);
  }
}
