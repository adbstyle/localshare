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
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ListingType, ListingCategory, PriceTimeUnit } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @Length(5, 200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsEnum(ListingType)
  type: ListingType;

  @ValidateIf((o) => o.type === 'SELL' || o.type === 'RENT')
  @IsInt()
  @Min(0)
  @Max(1000000)
  price?: number;

  @ValidateIf((o) => o.type === 'RENT')
  @IsEnum(PriceTimeUnit)
  priceTimeUnit?: PriceTimeUnit;

  @IsEnum(ListingCategory)
  category: ListingCategory;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  communityIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  groupIds?: string[];
}
