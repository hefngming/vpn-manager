import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { VerificationService } from '../verification.service';
import { TelegramService } from '../telegram.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private verificationService: VerificationService,
    private telegramService: TelegramService,
  ) {}

  async register(dto: RegisterDto) {
    // 验证验证码
    const isValidCode = await this.verificationService.verifyCode(
      dto.email,
      dto.verificationCode,
      'REGISTER',
    );

    if (!isValidCode) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 如果提供了设备ID，检查是否已被其他用户绑定
    if (dto.deviceId) {
      const deviceBound = await this.prisma.user.findUnique({
        where: { boundDeviceId: dto.deviceId },
      });

      if (deviceBound) {
        throw new ConflictException('Device already bound to another account');
      }
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 处理推荐码
    let referrerId: string | null = null;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        planType: 'FREE',
        boundDeviceId: dto.deviceId || null,
        deviceType: dto.deviceType || null,
        deviceName: dto.deviceName || null,
        expiryDate: null,
        referredBy: referrerId,
      },
    });

    // 发送 Telegram 通知
    await this.telegramService.notifyNewUser({
      email: user.email,
      planType: user.planType,
      referralCode: user.referralCode,
      referredBy: referrerId || undefined,
    });

    // 生成 JWT
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        planType: user.planType,
        boundDeviceId: user.boundDeviceId,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 验证密码
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 检查设备绑定（防止账号共享）
    if (user.boundDeviceId && user.boundDeviceId !== dto.deviceId) {
      throw new UnauthorizedException('Account is bound to another device');
    }

    // 如果用户首次登录且未绑定设备，绑定当前设备
    if (!user.boundDeviceId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          boundDeviceId: dto.deviceId,
          deviceType: dto.deviceType,
          deviceName: dto.deviceName,
        },
      });
    }

    // 更新最后登录信息
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        // lastLoginIp 可以从请求中获取
      },
    });

    // 检查是否有其他设备在线（单设备限制）
    const onlineDevice = await this.redisService.getUserOnlineDevice(user.id);
    if (onlineDevice && onlineDevice !== dto.deviceId) {
      // 踢掉之前的设备（实际应用中需要通过 WebSocket 或推送通知客户端）
      await this.redisService.removeUserOnline(user.id);
    }

    // 设置当前设备在线
    await this.redisService.setUserOnline(user.id, dto.deviceId);

    // 生成 JWT
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        planType: user.planType,
        boundDeviceId: user.boundDeviceId,
        expiryDate: user.expiryDate,
        dailyUsageBytes: user.dailyUsageBytes,
      },
      ...tokens,
    };
  }

  async logout(userId: string) {
    await this.redisService.removeUserOnline(userId);
    return { message: 'Logged out successfully' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    // 验证验证码
    const isValidCode = await this.verificationService.verifyCode(
      email,
      code,
      'RESET_PASSWORD',
    );

    if (!isValidCode) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 哈希新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 清除该用户的所有在线设备（安全措施）
    await this.redisService.removeUserOnline(user.id);

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    };
  }
}
