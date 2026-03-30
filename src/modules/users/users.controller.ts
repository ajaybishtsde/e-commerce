import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/gaurds/jwt.auth.gaurd';
import { RolesGuard } from 'src/common/gaurds/roles.gaurd';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import {
  UpdatePasswordDto,
  UpdateUserDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { Roles } from 'src/common/decorators/role.decorators';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async findOne(@Req() req: RequestWithUser): Promise<UserResponseDto> {
    return this.usersService.findOne(req.user.id);
  }

  @Get('all')
  @Roles(Role.ADMIN)
  async getAll(): Promise<UserResponseDto[]> {
    return this.usersService.getAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @Roles(Role.USER)
  async updateUser(
    @GetUser('id')
    id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  @Patch('me/password')
  @Roles(Role.USER)
  async changePassword(
    @GetUser('id')
    id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.changePassword(id, updatePasswordDto);
  }
}
