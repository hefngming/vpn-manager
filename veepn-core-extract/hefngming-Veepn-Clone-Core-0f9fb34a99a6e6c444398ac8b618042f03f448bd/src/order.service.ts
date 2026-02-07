import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ReferralService } from './referral.service';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { ManualPaymentProvider } from './payment/manual-payment.provider';
import { YipayProvider } from './payment/yipay.provider';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private referralService: ReferralService,
    private emailService: EmailService,
    private telegramService: TelegramService,
    private manualPaymentProvider: ManualPaymentProvider,
    private yipayProvider: YipayProvider,
  ) {}

  /**
   * 创建订单
   */
  async createOrder(
    userId: string,
    planType: 'FREE' | 'UNLIMITED' | 'DEDICATED',
    paymentMethod: 'WECHAT' | 'ALIPAY' | 'YIPAY',
  ) {
    // 获取套餐价格
    const amount = this.getPlanPrice(planType);

    // 根据支付方式选择支付提供商
    const provider = paymentMethod === 'YIPAY' 
      ? this.yipayProvider 
      : this.manualPaymentProvider;

    // 创建订单
    const result = await provider.createOrder({
      userId,
      planType,
      amount,
      paymentMethod,
    });

    // 发送 Telegram 通知
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.telegramService.notifyNewOrder({
        orderNumber: result.orderNumber,
        userEmail: user.email,
        planType,
        amount,
        paymentMethod,
      });
    }

    return result;
  }

  /**
   * 上传支付截图
   */
  async uploadPaymentProof(orderNumber: string, proofUrl: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Order already processed');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentProof: proofUrl },
    });

    // 发送 Telegram 通知
    const user = await this.prisma.user.findUnique({
      where: { id: order.userId },
    });

    if (user) {
      await this.telegramService.notifyPaymentProofUploaded({
        orderNumber: order.orderNumber,
        userEmail: user.email,
        paymentProof: proofUrl,
        planType: order.planType,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
      });
    }

    return { message: 'Payment proof uploaded successfully' };
  }

  /**
   * 管理员确认订单
   */
  async confirmOrder(orderNumber: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { user: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Order already processed');
    }

    // 更新订单状态
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        confirmedBy: adminId,
        confirmedAt: new Date(),
      },
    });

    // 激活用户套餐
    await this.activateUserPlan(order.userId, order.planType);

    // 发送确认邮件
    await this.emailService.sendOrderConfirmation(
      order.user.email,
      order.orderNumber,
      order.planType,
    );

    // 如果用户是被推荐的，且升级为订阅用户，给推荐人发放奖励
    if (order.planType === 'UNLIMITED') {
      await this.referralService.grantReferralBonus(order.userId);
    }

    return { message: 'Order confirmed successfully' };
  }

  /**
   * 激活用户套餐
   */
  private async activateUserPlan(userId: string, planType: 'FREE' | 'UNLIMITED') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 计算过期时间
    let expiryDate: Date | null = null;
    if (planType === 'UNLIMITED') {
      // 尊享版：永久有效（设置为100年后）
      expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 100);
    } else if (planType === 'DEDICATED') {
      // 专线版：永久有效（设置为100年后）
      expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 100);
    } else {
      // 免费版：24小时
      expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);
    }

    // 更新用户套餐
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        planType,
        expiryDate,
        freeTrialStartAt: planType === 'FREE' ? new Date() : user.freeTrialStartAt,
      },
    });
  }

  /**
   * 获取套餐价格
   */
  private getPlanPrice(planType: 'FREE' | 'UNLIMITED' | 'DEDICATED'): number {
    const prices = {
      FREE: 0,
      UNLIMITED: 199, // 尊享版价格
      DEDICATED: 399, // 专线版价格
    };
    return prices[planType];
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取所有待处理订单（管理员）
   */
  async getPendingOrders() {
    return this.prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Cannot cancel processed order');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Order cancelled successfully' };
  }
}
