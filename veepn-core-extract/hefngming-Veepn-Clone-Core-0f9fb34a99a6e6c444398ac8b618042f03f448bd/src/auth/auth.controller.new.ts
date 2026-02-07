import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerificationService } from '../verification.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private verificationService: VerificationService,
  ) {}

  /**
   * 发送注册验证码
   */
  @Post('send-register-code')
  @HttpCode(HttpStatus.OK)
  async sendRegisterCode(@Body() body: { email: string }) {
    await this.verificationService.sendRegisterCode(body.email);
    return { message: 'Verification code sent successfully' };
  }

  /**
   * 发送重置密码验证码
   */
  @Post('send-reset-code')
  @HttpCode(HttpStatus.OK)
  async sendResetCode(@Body() body: { email: string }) {
    await this.verificationService.sendResetPasswordCode(body.email);
    return { message: 'Verification code sent successfully' };
  }

  /**
   * 注册
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * 登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * 重置密码
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }
}
