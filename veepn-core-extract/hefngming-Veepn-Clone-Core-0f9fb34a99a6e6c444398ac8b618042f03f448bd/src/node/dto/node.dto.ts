import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNodeDto {
  @IsString()
  name: string;

  @IsString()
  countryCode: string;

  @IsString()
  rawConfig: string;

  @IsBoolean()
  isPremium: boolean;
}

export class UpdateNodeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  rawConfig?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
