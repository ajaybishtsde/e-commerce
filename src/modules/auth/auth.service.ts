import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { RegisterResponseDto } from './dto/register.response.dto';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  // register user
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    console.log(registerDto);
    try {
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      const user = await this.prismaService.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      console.log(hashedPassword);
      const tokens = await this.generateToken(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return {
        status: true,
        user: {
          ...user,
          refreshToken: tokens.refreshToken,
          accessToken: tokens.accessToken,
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
  // generate access and refresh tokens
  async generateToken(
    userId: number,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = { sub: userId, email };
      const refreshId = randomBytes(16).toString('hex');

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, { expiresIn: '15m' }),
        this.jwtService.signAsync(
          { ...payload, refreshId },
          { expiresIn: '7d' },
        ),
      ]);
      return { accessToken, refreshToken };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  // update token to database
  async updateRefreshToken(id: number, refreshToken: string): Promise<void> {
    await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        refreshToken,
      },
    });
  }

  async refreshTokens(id: number): Promise<RegisterResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateToken(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return {
      status: true,
      user: {
        ...user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async logout(userId: number) {
    try {
      await this.prismaService.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    } catch (error) {
      throw new ForbiddenException('Logout failed');
    }
  }
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user || !(await bcrypt.compare(password, user?.password))) {
      throw new UnauthorizedException('Email or Password does not match');
    }
    const tokens = await this.generateToken(user.id, user.email);
    await this.updateRefreshToken(user.id, user.email);

    return {
      status: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
      },
    };
  }
}
