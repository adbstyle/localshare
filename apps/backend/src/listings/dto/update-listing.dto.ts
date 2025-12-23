import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ListingType, ListingCategory } from '@prisma/client';

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @Length(5, 200)
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  price?: number;

  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  communityIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  groupIds?: string[];
}
