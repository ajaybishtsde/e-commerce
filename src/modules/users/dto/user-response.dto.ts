import { Role } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Matches,
  MinLength,
} from 'class-validator';

export class UserResponseDto {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Provide a valid email' })
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password must not be empty' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password should be minimum 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).*$/, {
    message:
      'Password must include uppercase, lowercase, number and special character',
  })
  newPassword: string;
}
