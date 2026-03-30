import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    console.log('>>>>>>>>>>>>>>>>>>', process.env.DATABASE_URL);
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }
  async onModuleInit() {
    await this.$connect();

    try {
      await this.$queryRaw`SELECT 1`;
      console.log('Database fully verified');
    } catch (error) {
      console.error('Database connection failed', error);
    }
  }
  async onModuleDestroy() {}
}
