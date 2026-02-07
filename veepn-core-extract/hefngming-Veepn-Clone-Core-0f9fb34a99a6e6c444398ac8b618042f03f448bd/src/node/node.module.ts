import { Module } from '@nestjs/common';
import { NodeController } from './node.controller';
import { NodeService } from './node.service';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../encryption.service';

@Module({
  controllers: [NodeController],
  providers: [NodeService, PrismaService, EncryptionService],
})
export class NodeModule {}
