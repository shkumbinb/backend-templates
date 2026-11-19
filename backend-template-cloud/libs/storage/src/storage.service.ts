import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { storageConfig } from './storage.config';

const DEFAULT_URL_EXPIRY_SECONDS = 15 * 60;

@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    const { bucket, client } = storageConfig(config);
    this.bucket = bucket;
    this.client = new S3Client(client);
  }

  /** For small files that already pass through the API. Large files: use `getUploadUrl`. */
  async upload(
    key: string,
    body: PutObjectCommandInput['Body'],
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /** A temporary URL the client can `GET` the file from. */
  getDownloadUrl(
    key: string,
    expiresIn = DEFAULT_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  /** A temporary URL the client can `PUT` the file to directly, with the same `Content-Type`. */
  getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = DEFAULT_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn },
    );
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
