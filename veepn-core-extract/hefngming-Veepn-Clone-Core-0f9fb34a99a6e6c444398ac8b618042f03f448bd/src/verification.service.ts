import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * 生成 6 位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送注册验证码
   */
  async sendRegisterCode(email: string): Promise<void> {
    // 检查是否频繁请求（1分钟内只能请求一次）
    const recentCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        type: 'REGISTER',
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // 1分钟内
        },
      },
    });

    if (recentCode) {
      throw new Error('请求过于频繁，请稍后再试');
    }

    // 检查邮箱是否已注册
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('该邮箱已被注册');
    }

    // 生成验证码
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 保存验证码
    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'REGISTER',
        expiresAt,
      },
    });

    // 发送邮件
    await this.emailService.sendVerificationCode(email, code, 'register');
  }

  /**
   * 发送重置密码验证码
   */
  async sendResetPasswordCode(email: string): Promise<void> {
    // 检查是否频繁请求（1分钟内只能请求一次）
    const recentCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        type: 'RESET_PASSWORD',
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // 1分钟内
        },
      },
    });

    if (recentCode) {
      throw new Error('请求过于频繁，请稍后再试');
    }

    // 检查邮箱是否存在
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('该邮箱未注册');
    }

    // 生成验证码
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 保存验证码
    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'RESET_PASSWORD',
        expiresAt,
        userId: user.id,
      },
    });

    // 发送邮件
    await this.emailService.sendVerificationCode(email, code, 'reset');
  }

  /**
   * 验证验证码
   */
  async verifyCode(email: string, code: string, type: 'REGISTER' | 'RESET_PASSWORD'): Promise<boolean> {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type,
        used: false,
        expiresAt: {
          gte: new Date(), // 未过期
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode) {
      return false;
    }

    // 标记为已使用
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    return true;
  }

  /**
   * 清理过期验证码（定时任务）
   */
  async cleanupExpiredCodes(): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
