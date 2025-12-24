import { IsString, IsOptional, Length, Matches, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  homeAddress?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +41791234567)',
  })
  phoneNumber?: string | null;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  preferredLanguage?: string;
}
