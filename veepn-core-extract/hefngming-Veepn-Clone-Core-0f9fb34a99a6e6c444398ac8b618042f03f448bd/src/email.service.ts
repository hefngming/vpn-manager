import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'siuminghe@gmail.com',
        pass: 'xznm dngy flap ollu', // 授权码
      },
    });
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(email: string, code: string, type: 'register' | 'reset'): Promise<void> {
    const subject = type === 'register' ? 'LggVPN 注册验证码' : 'LggVPN 密码重置验证码';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">LggVPN</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">验证码</h2>
          <p style="color: #666; font-size: 16px;">您好，</p>
          <p style="color: #666; font-size: 16px;">
            ${type === 'register' ? '感谢您注册 LggVPN！' : '您正在重置 LggVPN 账户密码。'}
          </p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin-bottom: 10px;">您的验证码是：</p>
            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 10px 0;">${code}</h1>
            <p style="color: #999; font-size: 14px; margin-top: 10px;">验证码有效期为 10 分钟</p>
          </div>
          <p style="color: #666; font-size: 14px;">如果这不是您的操作，请忽略此邮件。</p>
        </div>
        <div style="background-color: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">© 2026 LggVPN. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"LggVPN" <siuminghe@gmail.com>',
      to: email,
      subject,
      html,
    });
  }

  /**
   * 发送订单确认邮件
   */
  async sendOrderConfirmation(email: string, orderNumber: string, planType: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">LggVPN</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">订单确认</h2>
          <p style="color: #666; font-size: 16px;">您好，</p>
          <p style="color: #666; font-size: 16px;">您的订单已确认！</p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; margin: 5px 0;"><strong>订单号：</strong>${orderNumber}</p>
            <p style="color: #666; margin: 5px 0;"><strong>套餐类型：</strong>${planType === 'UNLIMITED' ? '尊享版' : '免费版'}</p>
          </div>
          <p style="color: #666; font-size: 14px;">现在您可以使用 LggVPN 客户端登录并享受服务了！</p>
        </div>
        <div style="background-color: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">© 2026 LggVPN. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"LggVPN" <siuminghe@gmail.com>',
      to: email,
      subject: 'LggVPN 订单确认',
      html,
    });
  }
}
