import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  // 主密钥（生产环境应从环境变量读取）
  private readonly masterKey: Buffer;

  constructor() {
    // 从环境变量获取主密钥，如果不存在则生成一个
    const keyHex = process.env.ENCRYPTION_MASTER_KEY || this.generateKey();
    this.masterKey = Buffer.from(keyHex, 'hex');
  }

  /**
   * 生成随机密钥
   */
  private generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * 加密节点配置
   * 
   * @param plaintext 明文节点配置
   * @returns 加密后的数据对象 { encrypted, iv, tag }
   */
  encryptNodeConfig(plaintext: string): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    try {
      // 生成随机 IV
      const iv = crypto.randomBytes(this.ivLength);

      // 创建加密器
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.masterKey,
        iv,
      );

      // 加密数据
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // 获取认证标签
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * 解密节点配置
   * 
   * @param encrypted 加密的数据
   * @param iv 初始化向量
   * @param tag 认证标签
   * @returns 解密后的明文
   */
  decryptNodeConfig(encrypted: string, iv: string, tag: string): string {
    try {
      // 创建解密器
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.masterKey,
        Buffer.from(iv, 'hex'),
      );

      // 设置认证标签
      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      // 解密数据
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * 加密节点对象（包含敏感字段）
   * 
   * @param nodeConfig 节点配置对象
   * @returns 加密后的节点对象
   */
  encryptNodeObject(nodeConfig: any): any {
    // 提取敏感字段
    const sensitiveData = {
      address: nodeConfig.address,
      port: nodeConfig.port,
      uuid: nodeConfig.uuid || nodeConfig.id,
      password: nodeConfig.password,
      host: nodeConfig.host,
    };

    // 加密敏感数据
    const encrypted = this.encryptNodeConfig(JSON.stringify(sensitiveData));

    // 返回加密后的节点对象（保留非敏感字段）
    return {
      id: nodeConfig.id,
      name: nodeConfig.name,
      countryCode: nodeConfig.countryCode,
      isPremium: nodeConfig.isPremium,
      isActive: nodeConfig.isActive,
      protocol: nodeConfig.protocol || 'vmess',
      // 加密的敏感数据
      encryptedConfig: encrypted.encrypted,
      iv: encrypted.iv,
      tag: encrypted.tag,
    };
  }

  /**
   * 解密节点对象
   * 
   * @param encryptedNode 加密的节点对象
   * @returns 完整的节点配置
   */
  decryptNodeObject(encryptedNode: any): any {
    const decrypted = this.decryptNodeConfig(
      encryptedNode.encryptedConfig,
      encryptedNode.iv,
      encryptedNode.tag,
    );

    const sensitiveData = JSON.parse(decrypted);

    return {
      ...encryptedNode,
      ...sensitiveData,
    };
  }

  /**
   * 生成新的主密钥（用于初始化）
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
