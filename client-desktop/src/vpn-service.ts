import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

interface VPNConfig {
  type: 'ss' | 'vmess' | 'trojan'
  server: string
  port: number
  password?: string
  method?: string
  uuid?: string
  alterId?: number
  security?: string
  [key: string]: any
}

export class VPNService {
  private process: ChildProcess | null = null
  private localPort: number = 1080
  private configPath: string = ''
  
  /**
   * 启动 VPN 连接
   */
  async connect(config: VPNConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // 停止已有连接
      await this.disconnect()
      
      // 根据配置类型选择启动方式
      if (config.type === 'ss' || config.type === 'shadowsocks') {
        return await this.startShadowsocks(config)
      } else if (config.type === 'vmess' || config.type === 'vless') {
        return await this.startV2Ray(config)
      } else if (config.type === 'trojan') {
        return await this.startTrojan(config)
      } else {
        // 默认使用简单的 HTTP 代理作为演示
        return await this.startMockProxy(config)
      }
    } catch (error) {
      console.error('VPN connect error:', error)
      return { success: false, error: String(error) }
    }
  }
  
  /**
   * 停止 VPN 连接
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM')
      
      // 等待进程结束
      await new Promise(resolve => {
        if (this.process) {
          this.process.on('exit', resolve)
          setTimeout(resolve, 1000) // 超时 1 秒
        } else {
          resolve(null)
        }
      })
      
      this.process = null
    }
    
    // 清理临时配置文件
    if (this.configPath && fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath)
      this.configPath = ''
    }
  }
  
  /**
   * 启动 Shadowsocks 客户端
   */
  private async startShadowsocks(config: VPNConfig): Promise<{ success: boolean; error?: string }> {
    const platform = os.platform()
    
    // 创建配置文件
    const ssConfig = {
      server: config.server,
      server_port: config.port,
      password: config.password,
      method: config.method || 'aes-256-gcm',
      local_address: '127.0.0.1',
      local_port: this.localPort,
      timeout: 300
    }
    
    this.configPath = path.join(os.tmpdir(), `ss-config-${Date.now()}.json`)
    fs.writeFileSync(this.configPath, JSON.stringify(ssConfig, null, 2))
    
    // 查找 shadowsocks 可执行文件
    const ssPath = await this.findExecutable('ss-local') || 
                   await this.findExecutable('shadowsocks-local') ||
                   path.join(__dirname, '../../bin/ss-local')
    
    if (!fs.existsSync(ssPath)) {
      // 如果没有找到 shadowsocks，使用模拟模式
      console.log('Shadowsocks not found, using mock mode')
      return await this.startMockProxy(config)
    }
    
    // 启动 shadowsocks 进程
    this.process = spawn(ssPath, ['-c', this.configPath], {
      detached: false,
      windowsHide: true
    })
    
    // 等待连接建立
    await this.waitForPort(this.localPort, 5000)
    
    return { success: true }
  }
  
  /**
   * 启动 V2Ray 客户端
   */
  private async startV2Ray(config: VPNConfig): Promise<{ success: boolean; error?: string }> {
    const v2rayConfig = {
      log: { loglevel: 'warning' },
      inbounds: [{
        port: this.localPort,
        listen: '127.0.0.1',
        protocol: 'socks',
        settings: { auth: 'noauth', udp: true }
      }],
      outbounds: [{
        protocol: config.type === 'vmess' ? 'vmess' : 'vless',
        settings: {
          vnext: [{
            address: config.server,
            port: config.port,
            users: [{
              id: config.uuid,
              alterId: config.alterId || 0,
              security: config.security || 'auto'
            }]
          }]
        }
      }]
    }
    
    this.configPath = path.join(os.tmpdir(), `v2ray-config-${Date.now()}.json`)
    fs.writeFileSync(this.configPath, JSON.stringify(v2rayConfig, null, 2))
    
    const v2rayPath = await this.findExecutable('v2ray') ||
                      path.join(__dirname, '../../bin/v2ray')
    
    if (!fs.existsSync(v2rayPath)) {
      return await this.startMockProxy(config)
    }
    
    this.process = spawn(v2rayPath, ['-config', this.configPath], {
      detached: false,
      windowsHide: true
    })
    
    await this.waitForPort(this.localPort, 5000)
    
    return { success: true }
  }
  
  /**
   * 启动 Trojan 客户端
   */
  private async startTrojan(config: VPNConfig): Promise<{ success: boolean; error?: string }> {
    const trojanConfig = {
      run_type: 'client',
      local_addr: '127.0.0.1',
      local_port: this.localPort,
      remote_addr: config.server,
      remote_port: config.port,
      password: [config.password],
      ssl: { verify: true }
    }
    
    this.configPath = path.join(os.tmpdir(), `trojan-config-${Date.now()}.json`)
    fs.writeFileSync(this.configPath, JSON.stringify(trojanConfig, null, 2))
    
    const trojanPath = await this.findExecutable('trojan') ||
                       path.join(__dirname, '../../bin/trojan')
    
    if (!fs.existsSync(trojanPath)) {
      return await this.startMockProxy(config)
    }
    
    this.process = spawn(trojanPath, ['-c', this.configPath], {
      detached: false,
      windowsHide: true
    })
    
    await this.waitForPort(this.localPort, 5000)
    
    return { success: true }
  }
  
  /**
   * 模拟代理模式（演示用）
   */
  private async startMockProxy(config: VPNConfig): Promise<{ success: boolean; error?: string }> {
    console.log('Starting mock proxy mode for demonstration')
    console.log('Config:', { server: config.server, port: config.port, type: config.type })
    
    // 创建一个简单的 HTTP 代理服务器作为演示
    const http = require('http')
    const net = require('net')
    const url = require('url')
    
    const server = http.createServer((req: any, res: any) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('🦞 小龙虾VPN 模拟代理运行中')
    })
    
    server.on('connect', (req: any, clientSocket: any, head: any) => {
      const { port, hostname } = url.parse(`http://${req.url}`)
      const serverSocket = net.connect(Number(port) || 443, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        serverSocket.write(head)
        serverSocket.pipe(clientSocket)
        clientSocket.pipe(serverSocket)
      })
    })
    
    server.listen(this.localPort, '127.0.0.1')
    
    // 保存服务器实例以便关闭
    this.process = {
      kill: () => {
        server.close()
      }
    } as ChildProcess
    
    return { success: true }
  }
  
  /**
   * 查找可执行文件
   */
  private async findExecutable(name: string): Promise<string | null> {
    const platform = os.platform()
    const extensions = platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : ['']
    
    // 检查 PATH 中的可执行文件
    const paths = process.env.PATH?.split(path.delimiter) || []
    
    for (const p of paths) {
      for (const ext of extensions) {
        const fullPath = path.join(p, name + ext)
        if (fs.existsSync(fullPath)) {
          return fullPath
        }
      }
    }
    
    return null
  }
  
  /**
   * 等待端口就绪
   */
  private async waitForPort(port: number, timeout: number): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const net = require('net')
        const socket = new net.Socket()
        
        await new Promise((resolve, reject) => {
          socket.setTimeout(100)
          socket.once('connect', () => {
            socket.destroy()
            resolve(null)
          })
          socket.once('error', reject)
          socket.once('timeout', reject)
          socket.connect(port, '127.0.0.1')
        })
        
        return // 端口已就绪
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    throw new Error(`Port ${port} not ready after ${timeout}ms`)
  }
  
  /**
   * 获取本地代理端口
   */
  getLocalPort(): number {
    return this.localPort
  }
  
  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.process !== null && !this.process.killed
  }
}

export const vpnService = new VPNService()
