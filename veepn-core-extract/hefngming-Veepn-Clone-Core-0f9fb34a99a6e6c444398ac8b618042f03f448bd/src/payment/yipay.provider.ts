import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, CreateOrderParams, CreateOrderResult, OrderQueryResult, CallbackResult } from './payment.interface';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

/**
 * 易支付提供商（预留接口）
 * 
 * 配置说明：
 * - YIPAY_PID: 易支付商户ID
 * - YIPAY_KEY: 易支付密钥
 * - YIPAY_API_URL: 易支付API地址
 * - YIPAY_NOTIFY_URL: 支付回调地址
 * - YIPAY_RETURN_URL: 支付成功跳转地址
 */
@Injectable()
export class YipayProvider implements IPaymentProvider {
  private readonly pid: string;
  private readonly key: string;
  private readonly apiUrl: string;
  private readonly notifyUrl: string;
  private readonly returnUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.pid = this.configService.get('YIPAY_PID', '');
    this.key = this.configService.get('YIPAY_KEY', '');
    this.apiUrl = this.configService.get('YIPAY_API_URL', 'https://api.yipay.com');
    this.notifyUrl = this.configService.get('YIPAY_NOTIFY_URL', '');
    this.returnUrl = this.configService.get('YIPAY_RETURN_URL', '');
  }

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
        paymentMethod: 'YIPAY',
        status: 'PENDING',
      },
    });

    // 构建易支付请求参数
    const paymentParams = {
      pid: this.pid,
      type: params.paymentMethod === 'WECHAT' ? 'wxpay' : 'alipay',
      out_trade_no: orderNumber,
      notify_url: this.notifyUrl,
      return_url: this.returnUrl,
      name: `LggVPN ${params.planType === 'UNLIMITED' ? '尊享版' : '免费版'}`,
      money: params.amount.toFixed(2),
    };

    // 生成签名
    const sign = this.generateSign(paymentParams);
    const paymentUrl = `${this.apiUrl}/submit.php?${this.buildQuery({ ...paymentParams, sign })}`;

    return {
      orderNumber,
      paymentUrl,
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

    // TODO: 调用易支付API查询订单状态
    // const response = await axios.get(`${this.apiUrl}/api.php`, {
    //   params: {
    //     act: 'order',
    //     pid: this.pid,
    //     key: this.key,
    //     out_trade_no: orderNumber,
    //   },
    // });

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paidAt: order.confirmedAt || undefined,
    };
  }

  /**
   * 处理支付回调
   */
  async handleCallback(data: any): Promise<CallbackResult> {
    // 验证签名
    const sign = data.sign;
    delete data.sign;
    const calculatedSign = this.generateSign(data);

    if (sign !== calculatedSign) {
      return {
        success: false,
        orderNumber: data.out_trade_no,
        message: 'Invalid signature',
      };
    }

    // 查找订单
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: data.out_trade_no },
    });

    if (!order) {
      return {
        success: false,
        orderNumber: data.out_trade_no,
        message: 'Order not found',
      };
    }

    // 更新订单状态
    if (data.trade_status === 'TRADE_SUCCESS') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      return {
        success: true,
        orderNumber: order.orderNumber,
      };
    }

    return {
      success: false,
      orderNumber: order.orderNumber,
      message: 'Payment not completed',
    };
  }

  /**
   * 生成订单号
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LGG${timestamp}${random}`;
  }

  /**
   * 生成签名
   */
  private generateSign(params: Record<string, any>): string {
    // 按键名排序
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&') + this.key;

    return crypto.createHash('md5').update(signStr).digest('hex');
  }

  /**
   * 构建查询字符串
   */
  private buildQuery(params: Record<string, any>): string {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
}
