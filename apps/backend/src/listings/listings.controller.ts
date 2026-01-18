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
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto, FilterListingsDto } from './dto';

@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Post()
  async create(@CurrentUser() user, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user, @Query() filters: FilterListingsDto) {
    return this.listingsService.findAll(user.id, filters);
  }

  @Get('paginated')
  async findAllPaginated(@CurrentUser() user, @Query() filters: FilterListingsDto) {
    return this.listingsService.findAllPaginated(user.id, filters);
  }

  @Get(':id')
  async findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.listingsService.findOne(id, user.id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user, @Param('id') id: string) {
    await this.listingsService.delete(id, user.id);
  }

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
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
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.listingsService.uploadImages(id, user.id, files);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @CurrentUser() user,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    await this.listingsService.deleteImage(id, imageId, user.id);
  }

  @Patch(':id/images/:imageId/cover')
  async setCoverImage(
    @CurrentUser() user,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.listingsService.setCoverImage(id, imageId, user.id);
  }
}
