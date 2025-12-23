import { IsString, IsOptional, Length, Matches } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +41791234567)',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  preferredLanguage?: string;
}
