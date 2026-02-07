import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户套餐是否有效
   * 
   * 免费版规则：
   * 1. 1GB 流量限制（每日重置）
   * 2. 或 24 小时时间限制（从首次使用开始计算）
   * 3. 达到任一限制即提示升级
   * 
   * 尊享版规则：
   * 1. 无限流量
   * 2. 永久有效（除非手动设置过期时间）
   */
  async checkSubscriptionStatus(userId: string): Promise<{
    isValid: boolean;
    reason?: string;
    needsUpgrade: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        isValid: false,
        reason: 'User not found',
        needsUpgrade: false,
      };
    }

    // 尊享版用户
    if (user.planType === 'UNLIMITED') {
      // 检查是否设置了过期时间
      if (user.expiryDate && user.expiryDate < new Date()) {
        return {
          isValid: false,
          reason: 'Subscription expired',
          needsUpgrade: true,
        };
      }
      
      return {
        isValid: true,
        needsUpgrade: false,
      };
    }

    // 专线版用户
    if (user.planType === 'DEDICATED') {
      // 检查是否设置了过期时间
      if (user.expiryDate && user.expiryDate < new Date()) {
        return {
          isValid: false,
          reason: 'Subscription expired',
          needsUpgrade: true,
        };
      }

      // 检查每日流量限制（10GB）
      const dailyLimit = 10737418240; // 10GB in bytes
      if (user.dailyUsageBytes >= dailyLimit) {
        return {
          isValid: false,
          reason: 'Daily traffic limit (10GB) reached',
          needsUpgrade: false,
        };
      }

      // 检查每月流量限制（100GB）
      const monthlyLimit = 107374182400; // 100GB in bytes
      if (user.monthlyUsageBytes >= monthlyLimit) {
        return {
          isValid: false,
          reason: 'Monthly traffic limit (100GB) reached',
          needsUpgrade: false,
        };
      }
      
      return {
        isValid: true,
        needsUpgrade: false,
      };
    }

    // 免费版用户
    if (user.planType === 'FREE') {
      // 检查 24 小时限制
      if (user.freeTrialStartAt) {
        const hoursPassed = (Date.now() - user.freeTrialStartAt.getTime()) / (1000 * 60 * 60);
        if (hoursPassed >= 24) {
          return {
            isValid: false,
            reason: 'Free trial period (24 hours) expired',
            needsUpgrade: true,
          };
        }
      }

      // 检查每日流量限制（1GB）
      const dailyLimit = 1073741824; // 1GB in bytes
      if (user.dailyUsageBytes >= dailyLimit) {
        return {
          isValid: false,
          reason: 'Daily traffic limit (1GB) reached',
          needsUpgrade: true,
        };
      }

      return {
        isValid: true,
        needsUpgrade: false,
      };
    }

    return {
      isValid: false,
      reason: 'Invalid plan type',
      needsUpgrade: false,
    };
  }

  /**
   * 开始免费试用（记录开始时间）
   */
  async startFreeTrial(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        freeTrialStartAt: new Date(),
      },
    });
  }

  /**
   * 升级到尊享版
   */
  async upgradeToPremium(userId: string, duration?: number): Promise<void> {
    const expiryDate = duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null; // null 表示永久有效

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'UNLIMITED',
        expiryDate,
        // 重置免费试用数据
        freeTrialStartAt: null,
        dailyUsageBytes: 0,
      },
    });
  }

  /**
   * 升级到专线版
   */
  async upgradeToDedicated(userId: string, duration?: number): Promise<void> {
    const expiryDate = duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null; // null 表示永久有效

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'DEDICATED',
        expiryDate,
        // 重置免费试用数据
        freeTrialStartAt: null,
        dailyUsageBytes: 0,
        monthlyUsageBytes: 0,
      },
    });
  }

  /**
   * 处理支付成功逻辑（自动化架构预留）
   * 
   * @param userId 用户 ID
   * @param planType 套餐类型
   * @param duration 持续时间（天），null 表示永久
   */
  async handlePaymentSuccess(userId: string, planType: 'UNLIMITED' | 'DEDICATED', duration: number | null = null): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 防止权限降级：如果用户已经是专线版，不能降级到尊享版
    if (user.planType === 'DEDICATED' && planType === 'UNLIMITED') {
      throw new Error('Cannot downgrade from DEDICATED to UNLIMITED');
    }

    if (planType === 'UNLIMITED') {
      await this.upgradeToPremium(userId, duration);
    } else if (planType === 'DEDICATED') {
      await this.upgradeToDedicated(userId, duration);
    }

    // 触发推荐奖励检查
    if (user.referredBy) {
      await this.processReferralReward(user.referredBy);
    }
  }

  /**
   * 处理推荐奖励
   */
  private async processReferralReward(referrerId: string): Promise<void> {
    // 增加推荐人 1GB 每日流量配额
    // 注意：这里需要根据具体业务逻辑实现，可能需要增加一个字段来存储额外配额
    // 目前简单实现为记录推荐奖励
    await this.prisma.user.update({
      where: { id: referrerId },
      data: {
        referralBonus: {
          increment: 1073741824, // +1GB
        },
      },
    });
  }

  /**
   * 获取用户套餐信息
   */
  async getSubscriptionInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const status = await this.checkSubscriptionStatus(userId);

    let remainingTraffic = null;
    let remainingTime = null;

    if (user.planType === 'FREE') {
      // 计算剩余流量
      const dailyLimit = 1073741824; // 1GB
      remainingTraffic = Math.max(0, dailyLimit - Number(user.dailyUsageBytes));

      // 计算剩余时间
      if (user.freeTrialStartAt) {
        const hoursPassed = (Date.now() - user.freeTrialStartAt.getTime()) / (1000 * 60 * 60);
        remainingTime = Math.max(0, 24 - hoursPassed);
      } else {
        remainingTime = 24; // 未开始试用
      }
    }

    return {
      planType: user.planType,
      isValid: status.isValid,
      needsUpgrade: status.needsUpgrade,
      reason: status.reason,
      expiryDate: user.expiryDate,
      remainingTraffic,
      remainingTime,
      dailyUsageBytes: Number(user.dailyUsageBytes),
      freeTrialStartAt: user.freeTrialStartAt,
    };
  }
}
