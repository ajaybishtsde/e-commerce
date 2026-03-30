import { Role } from '@prisma/client';

export class RegisterResponseDto {
  status: boolean;
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
    accessToken: string;
    refreshToken: string;
  };
}
