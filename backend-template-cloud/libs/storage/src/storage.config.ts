import type { S3ClientConfig } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export interface StorageConfig {
  bucket: string;
  client: S3ClientConfig;
}

/**
 * Env: `S3_BUCKET`, `AWS_REGION` (required), `AWS_ACCESS_KEY_ID`,
 * `AWS_SECRET_ACCESS_KEY` (optional: without them the SDK uses its default
 * chain, e.g. an IAM role), `S3_ENDPOINT` (optional, for MinIO/LocalStack).
 */
export function storageConfig(config: ConfigService): StorageConfig {
  const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
  const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
  const endpoint = config.get<string>('S3_ENDPOINT');

  return {
    bucket: config.getOrThrow<string>('S3_BUCKET'),
    client: {
      region: config.getOrThrow<string>('AWS_REGION'),
      ...(accessKeyId &&
        secretAccessKey && { credentials: { accessKeyId, secretAccessKey } }),
      ...(endpoint && { endpoint, forcePathStyle: true }),
    },
  };
}
