import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ErrorModule } from '@wayland/error';
import { LoggerModule } from '@wayland/logger';
import { PrismaModule } from './prisma/prisma.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ErrorModule,
    PrismaModule,
    UsersModule,
  ],
  controllers: [UserManagementController],
  providers: [
    UserManagementService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class UserManagementModule {}
