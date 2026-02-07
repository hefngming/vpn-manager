import { Injectable } from '@nestjs/common';
import { IPaymentProvider, CreateOrderParams, CreateOrderResult, OrderQueryResult, CallbackResult } from './payment.interface';
import { PrismaService } from '../prisma.service';

/**
 * 手动支付提供商
 * 
 * 用于展示个人收款码，用户支付后手动确认
 */
@Injectable()
export class ManualPaymentProvider implements IPaymentProvider {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建订单
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    // 生成订单号
    const orderNumber = this.generateOrderNumber();

    // 创建订单记录
    await this.prisma.order.create({
      data: {
        userId: params.userId,
        orderNumber,
        planType: params.planType,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        status: 'PENDING',
      },
    });

    // 根据套餐类型和支付方式返回对应的收款码URL
    let qrCodeUrl: string;
    
    if (params.planType === 'UNLIMITED') {
      // 尊享版 199元
      qrCodeUrl = params.paymentMethod === 'WECHAT' 
        ? '/payment/unlimited-wechat-qr.jpg' 
        : '/payment/unlimited-alipay-qr.jpg';
    } else if (params.planType === 'DEDICATED') {
      // 专线版 399元
      qrCodeUrl = params.paymentMethod === 'WECHAT' 
        ? '/payment/dedicated-wechat-qr.jpg' 
        : '/payment/dedicated-alipay-qr.jpg';
    } else {
      throw new Error('免费版不需要支付');
    }

    return {
      orderNumber,
      qrCodeUrl,
      amount: params.amount,
    };
  }

  /**
   * 查询订单状态
   */
  async queryOrder(orderNumber: string): Promise<OrderQueryResult> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paidAt: order.confirmedAt || undefined,
    };
  }

  /**
   * 处理支付回调（手动支付不需要）
   */
  async handleCallback(data: any): Promise<CallbackResult> {
    throw new Error('Manual payment does not support callback');
  }

  /**
   * 生成订单号
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LGG${timestamp}${random}`;
  }
}
