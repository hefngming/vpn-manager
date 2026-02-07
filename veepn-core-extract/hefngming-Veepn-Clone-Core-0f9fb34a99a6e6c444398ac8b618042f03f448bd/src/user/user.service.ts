import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { SubscriptionService } from '../subscription.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private subscriptionService: SubscriptionService,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        planType: true,
        boundDeviceId: true,
        expiryDate: true,
        dailyUsageBytes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 从 Redis 获取实时流量数据
    const todayTraffic = await this.redisService.getUserDailyTraffic(userId);

    return {
      ...user,
      dailyUsageBytes: todayTraffic,
    };
  }

  async unbindDevice(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { boundDeviceId: null },
    });

    await this.redisService.removeUserOnline(userId);

    return { message: 'Device unbound successfully' };
  }

  async getUserTrafficStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const todayTraffic = await this.redisService.getUserDailyTraffic(userId);

    // 免费用户每日 1GB 限制
    const dailyLimit = user.planType === 'FREE' ? 1073741824 : null;

    return {
      todayUsage: todayTraffic,
      dailyLimit,
      remaining: dailyLimit ? Math.max(0, dailyLimit - todayTraffic) : null,
      planType: user.planType,
    };
  }

  async getDeviceInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        boundDeviceId: true,
        deviceType: true,
        deviceName: true,
        lastLoginAt: true,
        lastLoginIp: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateDevice(userId: string, deviceId: string, deviceType: string, deviceName: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        boundDeviceId: deviceId,
        deviceType: deviceType as any,
        deviceName,
      },
    });

    await this.redisService.removeUserOnline(userId);

    return { message: 'Device updated successfully' };
  }

  async getSubscriptionInfo(userId: string) {
    return this.subscriptionService.getSubscriptionInfo(userId);
  }

  async upgradeToPremium(userId: string, duration?: number) {
    await this.subscriptionService.upgradeToPremium(userId, duration);
    return { message: 'Upgraded to premium successfully' };
  }
}
