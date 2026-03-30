import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields
      forbidNonWhitelisted: true, // throws error for extra fields
      transform: true, // converts payload to DTO class
      exceptionFactory: (errors) => {
        for (const error of errors) {
          if (error.constraints) {
            const message = Object.values(error.constraints)[0];
            return new BadRequestException(message);
          }
        }

        return new BadRequestException('Validation failed');
      },
    }),
  );
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorizations', 'Accept'],
  });
  console.log(process.env.PORT ?? 'no env');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  Logger.error('error starting server', error);
  process.exit(1);
});
