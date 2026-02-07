import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  verificationCode: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceType?: 'WINDOWS' | 'MACOS' | 'ANDROID';

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  deviceId: string;

  @IsString()
  deviceType: 'WINDOWS' | 'MACOS' | 'ANDROID';

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
