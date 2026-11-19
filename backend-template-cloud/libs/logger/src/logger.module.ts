import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { loggerConfig } from './logger.config';

/**
 * Import once in an app's root module (needs a global `ConfigModule`), then in
 * `main.ts`: `NestFactory.create(AppModule, { bufferLogs: true })` and
 * `app.useLogger(app.get(Logger))`.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: loggerConfig,
    }),
  ],
})
export class LoggerModule {}
