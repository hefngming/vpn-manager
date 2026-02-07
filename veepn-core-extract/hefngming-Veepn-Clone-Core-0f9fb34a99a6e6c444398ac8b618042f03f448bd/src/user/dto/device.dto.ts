import { IsString } from 'class-validator';

export class UpdateDeviceDto {
  @IsString()
  deviceId: string;

  @IsString()
  deviceType: 'WINDOWS' | 'MACOS' | 'ANDROID';

  @IsString()
  deviceName: string;
}
