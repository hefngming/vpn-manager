import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NodeModule } from './node/node.module';
import { TrafficModule } from './traffic/traffic.module';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MulterModule.register({
      dest: './public/uploads',
    }),
    AuthModule,
    UserModule,
    NodeModule,
    TrafficModule,
  ],
  controllers: [UploadController],
  providers: [PrismaService, RedisService, UploadService],
})
export class AppModule {}
