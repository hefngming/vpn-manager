import { Module } from '@nestjs/common';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';

@Module({
  controllers: [TrafficController],
  providers: [TrafficService, PrismaService, RedisService],
})
export class TrafficModule {}
