import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // 设置用户在线状态
  async setUserOnline(userId: string, deviceId: string): Promise<void> {
    await this.client.set(`user:online:${userId}`, deviceId, 'EX', 3600); // 1小时过期
  }

  // 获取用户在线设备
  async getUserOnlineDevice(userId: string): Promise<string | null> {
    return await this.client.get(`user:online:${userId}`);
  }

  // 删除用户在线状态
  async removeUserOnline(userId: string): Promise<void> {
    await this.client.del(`user:online:${userId}`);
  }

  // 增加用户流量使用
  async incrementUserTraffic(userId: string, bytes: number): Promise<number> {
    const key = `user:traffic:${userId}:${new Date().toISOString().split('T')[0]}`;
    const result = await this.client.incrby(key, bytes);
    await this.client.expire(key, 86400 * 2); // 2天过期
    return result;
  }

  // 获取用户当日流量
  async getUserDailyTraffic(userId: string): Promise<number> {
    const key = `user:traffic:${userId}:${new Date().toISOString().split('T')[0]}`;
    const result = await this.client.get(key);
    return result ? parseInt(result, 10) : 0;
  }
}
