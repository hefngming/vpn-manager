import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { SubscriptionService } from '../subscription.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, RedisService, SubscriptionService],
})
export class UserModule {}
