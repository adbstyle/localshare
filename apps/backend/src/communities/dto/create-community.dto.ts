import { IsString, Length, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommunityDto {
  @IsString()
  @Length(3, 100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Transform(({ value }) => value?.trim())
  description?: string;
}
