import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

/** Import in the modules that send email (needs a global `ConfigModule`). */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
