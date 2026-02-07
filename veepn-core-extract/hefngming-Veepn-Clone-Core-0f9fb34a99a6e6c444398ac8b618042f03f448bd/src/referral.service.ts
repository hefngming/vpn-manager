import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  /**
   * 当被推荐用户升级为订阅用户时，给推荐人增加流量奖励
   * 
   * @param userId 被推荐用户ID
   */
  async grantReferralBonus(userId: string): Promise<void> {
    // 查找被推荐用户
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { referrer: true },
    });

    if (!user || !user.referrer) {
      return; // 没有推荐人，跳过
    }

    // 检查用户是否已经是订阅用户
    if (user.planType !== 'UNLIMITED') {
      return; // 只有订阅用户才触发奖励
    }

    // 检查推荐人是否已经获得过这个用户的奖励
    const existingBonus = await this.prisma.user.findFirst({
      where: {
        id: user.referrer.id,
        referrals: {
          some: {
            id: userId,
            planType: 'UNLIMITED',
          },
        },
      },
    });

    if (existingBonus) {
      // 已经发放过奖励，避免重复
      return;
    }

    // 给推荐人增加 1GB 流量奖励
    const bonusBytes = 1024 * 1024 * 1024; // 1GB

    await this.prisma.user.update({
      where: { id: user.referrer.id },
      data: {
        referralBonus: {
          increment: bonusBytes,
        },
      },
    });

    console.log(`Granted 1GB referral bonus to user ${user.referrer.id} for referring ${userId}`);
  }

  /**
   * 获取用户的推荐统计
   */
  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          select: {
            id: true,
            email: true,
            planType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalReferrals = user.referrals.length;
    const subscribedReferrals = user.referrals.filter(r => r.planType === 'UNLIMITED').length;
    const totalBonus = user.referralBonus;

    return {
      referralCode: user.referralCode,
      totalReferrals,
      subscribedReferrals,
      totalBonusBytes: totalBonus,
      totalBonusGB: (totalBonus / (1024 * 1024 * 1024)).toFixed(2),
      referrals: user.referrals,
    };
  }

  /**
   * 获取用户的有效流量配额（包含推荐奖励）
   */
  async getUserEffectiveQuota(userId: string): Promise<bigint> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 免费版：1GB + 推荐奖励
    if (user.planType === 'FREE') {
      const baseQuota = BigInt(1024 * 1024 * 1024); // 1GB
      return baseQuota + user.referralBonus;
    }

    // 尊享版：无限流量
    return BigInt(-1);
  }

  /**
   * 检查用户是否达到流量限制
   */
  async isQuotaExceeded(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 尊享版无限流量
    if (user.planType === 'UNLIMITED') {
      return false;
    }

    // 免费版：检查每日使用量是否超过配额
    const effectiveQuota = await this.getUserEffectiveQuota(userId);
    return user.dailyUsageBytes >= effectiveQuota;
  }
}
