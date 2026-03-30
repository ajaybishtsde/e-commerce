import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register.response.dto';
import { RefreshTokenGaurd } from './gaurds/refresh-token.gaurd';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/gaurds/jwt.auth.gaurd';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(registerDto);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGaurd)
  async refresh(@GetUser('id') userId: number) {
    return await this.authService.refreshTokens(userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@GetUser('id') userId: number) {
    await this.authService.logout(userId);
    return { status: true, message: 'Successfully logged out' };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<RegisterResponseDto> {
    return await this.authService.login(loginDto);
  }
}
