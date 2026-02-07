import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

interface ClashConfig {
  server: string
  port: number
  password?: string
  method?: string
  uuid?: string
  alterId?: number
  security?: string
  type: 'ss' | 'vmess' | 'trojan' | 'vless'
  name: string
}

/**
 * Clash VPN 服务管理器
 * 基于 Dreamacro/clash 开源项目
 * GitHub: https://github.com/Dreamacro/clash
 */
export class ClashService {
  private process: ChildProcess | null = null
  private configPath: string = ''
  private readonly localPort: number = 7890
  private readonly apiPort: number = 9090

  /**
   * 获取 Clash 可执行文件路径
   */
  private getClashPath(): string {
    const platform = os.platform()
    const arch = os.arch()
    
    let binaryName = 'clash'
    let platformDir = ''
    
    if (platform === 'win32') {
      binaryName = 'clash.exe'
      platformDir = 'windows'
    } else if (platform === 'darwin') {
      platformDir = 'macos'
    } else {
      platformDir = 'linux'
    }
    
    // 优先使用打包的二进制文件
    const bundledPath = path.join(__dirname, '../../bin', platformDir, binaryName)
    if (fs.existsSync(bundledPath)) {
      return bundledPath
    }
    
    // 检查系统 PATH
    return binaryName
  }

  /**
   * 生成 Clash 配置文件
   */
  private generateConfig(config: ClashConfig): string {
    let proxyConfig: any = {
      name: config.name || 'Proxy',
      type: config.type,
      server: config.server,
      port: config.port,
    }

    // 根据协议类型添加特定参数
    if (config.type === 'ss') {
      proxyConfig = {
        ...proxyConfig,
        password: config.password,
        cipher: config.method || 'aes-256-gcm',
      }
    } else if (config.type === 'vmess') {
      proxyConfig = {
        ...proxyConfig,
        uuid: config.uuid,
        alterId: config.alterId || 0,
        cipher: config.security || 'auto',
      }
    } else if (config.type === 'trojan') {
      proxyConfig = {
        ...proxyConfig,
        password: config.password,
      }
    }

    const clashConfig = {
      'mixed-port': this.localPort,
      'allow-lan': false,
      mode: 'rule',
      'log-level': 'info',
      'external-controller': `127.0.0.1:${this.apiPort}`,
      proxies: [proxyConfig],
      'proxy-groups': [
        {
          name: 'PROXY',
          type: 'select',
          proxies: [proxyConfig.name],
        },
      ],
      rules: ['MATCH,PROXY'],
    }

    return JSON.stringify(clashConfig, null, 2)
  }

  /**
   * 启动 Clash VPN
   */
  async connect(config: ClashConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // 停止已有连接
      await this.disconnect()

      // 创建配置文件
      const configContent = this.generateConfig(config)
      this.configPath = path.join(os.tmpdir(), `clash-config-${Date.now()}.json`)
      fs.writeFileSync(this.configPath, configContent)

      // 获取 Clash 路径
      const clashPath = this.getClashPath()

      // 启动 Clash 进程
      this.process = spawn(clashPath, ['-f', this.configPath], {
        detached: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      // 记录日志
      this.process.stdout?.on('data', (data) => {
        console.log('[Clash]', data.toString())
      })

      this.process.stderr?.on('data', (data) => {
        console.error('[Clash Error]', data.toString())
      })

      // 等待 Clash 启动
      await this.waitForClashReady(10000)

      console.log(`Clash started on port ${this.localPort}`)
      return { success: true }
    } catch (error) {
      console.error('Clash connect error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * 停止 Clash VPN
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      // 优雅关闭
      this.process.kill('SIGTERM')

      // 等待进程结束
      await new Promise((resolve) => {
        if (this.process) {
          this.process.on('exit', resolve)
          setTimeout(resolve, 2000)
        } else {
          resolve(null)
        }
      })

      this.process = null
    }

    // 清理配置文件
    if (this.configPath && fs.existsSync(this.configPath)) {
      try {
        fs.unlinkSync(this.configPath)
      } catch (e) {
        console.error('Failed to cleanup config file:', e)
      }
      this.configPath = ''
    }
  }

  /**
   * 等待 Clash 就绪
   */
  private async waitForClashReady(timeout: number): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        // 检查 API 端口是否可用
        const http = require('http')
        await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${this.apiPort}`, (res: any) => {
            if (res.statusCode === 200 || res.statusCode === 404) {
              resolve(null)
            } else {
              reject(new Error(`Status: ${res.statusCode}`))
            }
          })
          req.on('error', reject)
          req.setTimeout(500, () => {
            req.destroy()
            reject(new Error('Timeout'))
          })
        })

        return // Clash 已就绪
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    throw new Error(`Clash failed to start within ${timeout}ms`)
  }

  /**
   * 获取本地 SOCKS5/HTTP 代理端口
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

  /**
   * 获取 Clash 版本信息
   */
  async getVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      const clashPath = this.getClashPath()
      const child = spawn(clashPath, ['-v'], { timeout: 5000 })

      let output = ''
      child.stdout?.on('data', (data) => {
        output += data.toString()
      })

      child.on('close', () => {
        resolve(output.trim() || null)
      })

      child.on('error', () => {
        resolve(null)
      })
    })
  }
}

export const clashService = new ClashService()
