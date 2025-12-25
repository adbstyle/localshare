import { IsString, Length, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGroupDto {
  @IsString()
  @Length(3, 100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsUUID()
  communityId: string;
}
