import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.getUserProfile(req.user.userId);
  }

  @Post('unbind-device')
  async unbindDevice(@Request() req) {
    return this.userService.unbindDevice(req.user.userId);
  }

  @Get('traffic')
  async getTrafficStats(@Request() req) {
    return this.userService.getUserTrafficStats(req.user.userId);
  }

  @Get('device')
  async getDeviceInfo(@Request() req) {
    return this.userService.getDeviceInfo(req.user.userId);
  }

  @Post('update-device')
  async updateDevice(@Request() req, @Body() dto: any) {
    return this.userService.updateDevice(
      req.user.userId,
      dto.deviceId,
      dto.deviceType,
      dto.deviceName,
    );
  }

  @Get('subscription')
  async getSubscription(@Request() req) {
    return this.userService.getSubscriptionInfo(req.user.userId);
  }

  @Post('upgrade')
  async upgradeToPremium(@Request() req, @Body() dto: { duration?: number }) {
    return this.userService.upgradeToPremium(req.user.userId, dto.duration);
  }
}
