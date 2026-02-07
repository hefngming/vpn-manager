import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../encryption.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class NodeService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async getAvailableNodes(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 严格根据用户套餐类型返回节点
    let allowedNodeTypes: string[];
    
    if (user.planType === 'FREE') {
      // 免费用户：只能看到免费节点
      allowedNodeTypes = ['FREE'];
    } else if (user.planType === 'UNLIMITED') {
      // 尊享版用户：可以看到免费 + 尊享节点
      allowedNodeTypes = ['FREE', 'PREMIUM'];
    } else if (user.planType === 'DEDICATED') {
      // 专线版用户：可以看到所有节点
      allowedNodeTypes = ['FREE', 'PREMIUM', 'DEDICATED'];
    } else {
      allowedNodeTypes = ['FREE'];
    }

    const nodes = await this.prisma.node.findMany({
      where: {
        isActive: true,
        nodeType: {
          in: allowedNodeTypes,
        },
      },
      select: {
        id: true,
        name: true,
        countryCode: true,
        nodeType: true,
        weight: true,
        isPremium: true,
        rawConfig: true,
      },
      // 按权重降序排列（专线节点置顶）
      orderBy: [
        { weight: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // 加密节点配置
    return nodes.map(node => this.encryptNodeForClient(node));
  }

  async getNodeById(nodeId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    if (!node.isActive) {
      throw new ForbiddenException('Node is not active');
    }

    // 检查权限：免费用户不能访问高级节点
    if (node.isPremium && user.planType === 'FREE') {
      throw new ForbiddenException('Premium node requires UNLIMITED plan');
    }

    // 加密节点配置
    return this.encryptNodeForClient(node);
  }

  async createNode(data: {
    name: string;
    countryCode: string;
    rawConfig: string;
    isPremium: boolean;
  }) {
    return this.prisma.node.create({
      data,
    });
  }

  async updateNode(
    nodeId: string,
    data: {
      name?: string;
      countryCode?: string;
      rawConfig?: string;
      isPremium?: boolean;
      isActive?: boolean;
    },
  ) {
    return this.prisma.node.update({
      where: { id: nodeId },
      data,
    });
  }

  async deleteNode(nodeId: string) {
    return this.prisma.node.delete({
      where: { id: nodeId },
    });
  }

  /**
   * 加密节点配置供客户端使用
   */
  private encryptNodeForClient(node: any) {
    const encrypted = this.encryptionService.encryptNodeConfig(node.rawConfig);
    
    // 处理节点名称，添加专线标签
    let displayName = node.name;
    if (node.nodeType === 'DEDICATED') {
      // 专线节点添加金色 V-IEPL 标签（客户端通过 nodeType 渲染金色，这里添加文字标识）
      displayName = `[V-IEPL] ${node.name}`;
    } else if (node.nodeType === 'PREMIUM') {
      displayName = `[Premium] ${node.name}`;
    }

    return {
      id: node.id,
      name: displayName,
      originalName: node.name,
      countryCode: node.countryCode,
      nodeType: node.nodeType,
      weight: node.weight,
      isPremium: node.isPremium,
      // 加密后的配置
      encryptedConfig: encrypted.encrypted,
      iv: encrypted.iv,
      tag: encrypted.tag,
    };
  }
}
