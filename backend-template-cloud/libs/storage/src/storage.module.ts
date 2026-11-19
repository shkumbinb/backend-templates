import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/** Import in the modules that store files (needs a global `ConfigModule`). */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
