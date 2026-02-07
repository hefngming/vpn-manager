import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private readonly adminChatId: string = '7293658714';
  private readonly botToken: string = '8292869671:AAES2qE5-r5O0eHZ30IE0AQ2GC4ArcxXyqk';

  constructor() {
    this.bot = new TelegramBot(this.botToken, { polling: false });
  }

  /**
   * 发送新订单通知给管理员
   */
  async notifyNewOrder(order: {
    orderNumber: string;
    userEmail: string;
    planType: string;
    amount: number;
    paymentMethod: string;
    paymentProof?: string;
  }): Promise<void> {
    const message = `
🆕 <b>新订单通知</b>

📧 用户邮箱: <code>${order.userEmail}</code>
📦 套餐类型: ${order.planType === 'UNLIMITED' ? '尊享版' : '免费版'}
💰 订单金额: ¥${order.amount.toFixed(2)}
💳 支付方式: ${this.getPaymentMethodName(order.paymentMethod)}
🔢 订单号: <code>${order.orderNumber}</code>
⏰ 创建时间: ${new Date().toLocaleString('zh-CN')}

${order.paymentProof ? `📸 支付截图: ${order.paymentProof}` : '⚠️ 等待用户上传支付截图'}

请尽快确认订单！
    `.trim();

    await this.bot.sendMessage(this.adminChatId, message, {
      parse_mode: 'HTML',
    });
  }

  /**
   * 发送新用户注册通知给管理员
   */
  async notifyNewUser(user: {
    email: string;
    planType: string;
    referralCode: string;
    referredBy?: string;
  }): Promise<void> {
    const message = `
👤 <b>新用户注册</b>

📧 邮箱: <code>${user.email}</code>
📦 套餐: ${user.planType === 'UNLIMITED' ? '尊享版' : '免费版'}
🎫 推荐码: <code>${user.referralCode}</code>
${user.referredBy ? `👥 推荐人: ${user.referredBy}` : ''}
⏰ 注册时间: ${new Date().toLocaleString('zh-CN')}
    `.trim();

    await this.bot.sendMessage(this.adminChatId, message, {
      parse_mode: 'HTML',
    });
  }

  /**
   * 发送流量耗尽通知给管理员
   */
  async notifyTrafficExhausted(user: {
    email: string;
    dailyUsageBytes: bigint;
    planType: string;
  }): Promise<void> {
    const usageGB = (Number(user.dailyUsageBytes) / (1024 * 1024 * 1024)).toFixed(2);

    const message = `
⚠️ <b>用户流量耗尽</b>

📧 用户邮箱: <code>${user.email}</code>
📦 当前套餐: ${user.planType === 'UNLIMITED' ? '尊享版' : '免费版'}
📊 已用流量: ${usageGB} GB
⏰ 时间: ${new Date().toLocaleString('zh-CN')}

${user.planType === 'FREE' ? '💡 提示：该用户可能需要升级套餐' : ''}
    `.trim();

    await this.bot.sendMessage(this.adminChatId, message, {
      parse_mode: 'HTML',
    });
  }

  /**
   * 发送订单确认通知给用户
   */
  async notifyUserOrderConfirmed(userChatId: string, order: {
    orderNumber: string;
    planType: string;
    amount: number;
  }): Promise<void> {
    const message = `
✅ <b>订单确认成功</b>

您的订单已确认，套餐已激活！

📦 套餐类型: ${order.planType === 'UNLIMITED' ? '尊享版' : '免费版'}
💰 订单金额: ¥${order.amount.toFixed(2)}
🔢 订单号: <code>${order.orderNumber}</code>

现在您可以使用 LggVPN 客户端登录并享受服务了！

感谢您的支持！🎉
    `.trim();

    try {
      await this.bot.sendMessage(userChatId, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Failed to send Telegram message to user:', error);
      // 用户可能没有与 Bot 交互过，忽略错误
    }
  }

  /**
   * 通知管理员：支付截图已上传
   */
  async notifyPaymentProofUploaded(data: {
    orderNumber: string;
    userEmail: string;
    paymentProof: string;
    planType?: string;
    amount?: number;
    paymentMethod?: string;
  }): Promise<void> {
    const message = `
📸 <b>支付截图已上传</b>

📧 用户邮箱: <code>${data.userEmail}</code>
🔢 订单号: <code>${data.orderNumber}</code>
💼 套餐类型: ${data.planType === 'UNLIMITED' ? '尊享版' : '免费版'}
💰 订单金额: ￥${data.amount?.toFixed(2) || '0.00'}
💳 支付方式: ${data.paymentMethod === 'WECHAT' ? '微信支付' : '支付宝'}
🖼️ 截图链接: ${data.paymentProof}
⏰ 上传时间: ${new Date().toLocaleString('zh-CN')}

👉 请尽快确认订单！
    `.trim();

    await this.bot.sendMessage(this.adminChatId, message, {
      parse_mode: 'HTML',
    });
  }

  /**
   * 发送推荐奖励通知给管理员
   */
  async notifyReferralBonus(referrer: {
    email: string;
    referredUserEmail: string;
    bonusGB: number;
  }): Promise<void> {
    const message = `
🎁 <b>推荐奖励发放</b>

👤 推荐人: <code>${referrer.email}</code>
👥 被推荐人: <code>${referrer.referredUserEmail}</code>
🎁 奖励流量: ${referrer.bonusGB} GB
⏰ 时间: ${new Date().toLocaleString('zh-CN')}
    `.trim();

    await this.bot.sendMessage(this.adminChatId, message, {
      parse_mode: 'HTML',
    });
  }

  /**
   * 获取支付方式名称
   */
  private getPaymentMethodName(method: string): string {
    const names: Record<string, string> = {
      WECHAT: '微信支付',
      ALIPAY: '支付宝',
      YIPAY: '易支付',
    };
    return names[method] || method;
  }

  /**
   * 发送测试消息
   */
  async sendTestMessage(): Promise<void> {
    const message = `
🤖 <b>LggVPN Bot 测试消息</b>

Bot 已成功连接！
⏰ 时间: ${new Date().toLocaleString('zh-CN')}
    `.trim();

    await this.bot.sendMessage(this.adminChatId, message, {
      parse_mode: 'HTML',
    });
  }
}
