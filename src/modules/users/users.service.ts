import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  UpdatePasswordDto,
  UpdateUserDto,
  UserResponseDto,
} from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;

  constructor(private prismaService: PrismaService) {}

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getAll(): Promise<UserResponseDto[]> {
    const allUsers = await this.prismaService.user.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!allUsers.length) throw new NotFoundException('Users not found');

    return allUsers;
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await this.prismaService.user.findUnique({
        where: {
          email: data.email,
        },
      });
      if (emailTaken) throw new ConflictException('Email already taken');
    }

    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  }

  async changePassword(id: number, data: UpdatePasswordDto) {
    const { currentPassword, newPassword } = data;
    const userExist = await this.prismaService.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!userExist) throw new NotFoundException('User not found');

    const isCurrentPasswordMatch = await bcrypt.compare(
      currentPassword,
      userExist.password,
    );

    if (!isCurrentPasswordMatch)
      throw new BadRequestException('Old password does not match');

    const isSamePassword = await bcrypt.compare(
      newPassword,
      userExist.password,
    );
    if (isSamePassword) {
      throw new BadRequestException('Old and new password can not be same');
    }
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
    return {
      status: true,
      message: 'Password updated',
    };
  }

  async delete(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
    return {
      status: true,
      message: 'User deleted',
    };
  }
}
