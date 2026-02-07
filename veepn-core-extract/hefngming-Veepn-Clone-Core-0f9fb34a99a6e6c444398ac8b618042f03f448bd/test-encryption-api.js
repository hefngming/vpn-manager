/**
 * 测试加密 API 的脚本
 * 演示节点加密分发功能
 */

const crypto = require('crypto');

// 模拟加密服务
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.masterKey = Buffer.from(
      '7f7fa9be60f1692f98b87b21a8655dc7d9d2b29c381137feeb90c71c69c980e2',
      'hex'
    );
  }

  encryptNodeConfig(plaintext) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  decryptNodeConfig(encrypted, iv, tag) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.masterKey,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// 模拟节点数据
const mockNodes = [
  {
    id: '1',
    name: 'US - New York',
    countryCode: 'US',
    isPremium: false,
    rawConfig: 'vmess://eyJhZGQiOiIxMC4xMC4xMC4xMCIsInBvcnQiOjQ0MywidXVpZCI6IjEyMzQ1Njc4LWFiY2QtZWZnaC1pamtsbW5vcHFyc3QifQ==',
  },
  {
    id: '2',
    name: 'UK - London',
    countryCode: 'GB',
    isPremium: true,
    rawConfig: 'vless://87654321-dcba-hgfe-tsrqponmlkji@20.20.20.20:443?encryption=none&security=tls&type=ws&host=example.com&path=/ws',
  },
  {
    id: '3',
    name: 'SG - Singapore',
    countryCode: 'SG',
    isPremium: false,
    rawConfig: 'trojan://password123@30.30.30.30:443?security=tls&type=tcp&headerType=none',
  },
];

// 测试加密功能
console.log('='.repeat(80));
console.log('LggVPN 节点加密分发 Demo');
console.log('='.repeat(80));
console.log();

const encryptionService = new EncryptionService();

console.log('📋 原始节点数据：');
console.log(JSON.stringify(mockNodes, null, 2));
console.log();

console.log('🔐 加密后的 API 响应（客户端接收）：');
const encryptedNodes = mockNodes.map(node => {
  const encrypted = encryptionService.encryptNodeConfig(node.rawConfig);
  
  return {
    id: node.id,
    name: node.name,
    countryCode: node.countryCode,
    isPremium: node.isPremium,
    // 加密后的配置
    encryptedConfig: encrypted.encrypted,
    iv: encrypted.iv,
    tag: encrypted.tag,
  };
});

console.log(JSON.stringify(encryptedNodes, null, 2));
console.log();

console.log('✅ 验证解密功能：');
encryptedNodes.forEach((encNode, index) => {
  try {
    const decrypted = encryptionService.decryptNodeConfig(
      encNode.encryptedConfig,
      encNode.iv,
      encNode.tag
    );
    
    console.log(`节点 ${index + 1} (${encNode.name}):`);
    console.log(`  原始配置: ${mockNodes[index].rawConfig}`);
    console.log(`  解密配置: ${decrypted}`);
    console.log(`  匹配: ${decrypted === mockNodes[index].rawConfig ? '✓' : '✗'}`);
    console.log();
  } catch (error) {
    console.log(`节点 ${index + 1} 解密失败: ${error.message}`);
  }
});

console.log('='.repeat(80));
console.log('Demo 完成！');
console.log('='.repeat(80));
console.log();
console.log('📝 说明：');
console.log('1. 后端使用 AES-256-GCM 加密节点配置');
console.log('2. API 返回加密后的数据（encrypted, iv, tag）');
console.log('3. 客户端使用相同密钥解密获取真实配置');
console.log('4. 敏感信息（IP、UUID、端口）完全加密传输');
console.log();
