import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TrafficService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async reportTraffic(userId: string, bytes: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // 检查免费用户流量限制
    if (user.planType === 'FREE') {
      const todayTraffic = await this.redisService.getUserDailyTraffic(userId);
      const dailyLimit = this.configService.get('FREE_PLAN_DAILY_LIMIT', 1073741824);

      if (todayTraffic + bytes > dailyLimit) {
        throw new ForbiddenException('Daily traffic limit exceeded');
      }
    }

    // 更新 Redis 中的流量计数
    const newTotal = await this.redisService.incrementUserTraffic(userId, bytes);

    // 记录流量日志（可选，用于统计分析）
    await this.prisma.trafficLog.create({
      data: {
        userId,
        usageBytes: BigInt(bytes),
      },
    });

    return {
      success: true,
      totalToday: newTotal,
    };
  }

  async getTrafficHistory(userId: string, days: number = 7) {
    const logs = await this.prisma.trafficLog.findMany({
      where: {
        userId,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return logs.map((log) => ({
      date: log.date,
      usageBytes: log.usageBytes.toString(),
    }));
  }

  async resetDailyTraffic(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyUsageBytes: 0 },
    });

    return { message: 'Daily traffic reset successfully' };
  }
}
