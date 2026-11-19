import { NestFactory } from '@nestjs/core';
import { Logger } from '@wayland/logger';
import { UserManagementModule } from './user-management.module';

async function bootstrap() {
  const app = await NestFactory.create(UserManagementModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
