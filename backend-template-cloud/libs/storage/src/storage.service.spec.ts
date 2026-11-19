import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const env = {
  S3_BUCKET: 'test-bucket',
  AWS_REGION: 'eu-north-1',
  AWS_ACCESS_KEY_ID: 'AKIATEST',
  AWS_SECRET_ACCESS_KEY: 'secret',
};

describe('StorageService', () => {
  const send = jest
    .spyOn(S3Client.prototype, 'send')
    .mockResolvedValue({} as never);

  beforeEach(() => send.mockClear());

  it('uploads to the configured bucket', async () => {
    const service = new StorageService(new ConfigService(env));

    await service.upload('avatars/1.png', Buffer.from('x'), 'image/png');

    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'avatars/1.png',
      Body: Buffer.from('x'),
      ContentType: 'image/png',
    });
  });

  it('deletes from the configured bucket', async () => {
    const service = new StorageService(new ConfigService(env));

    await service.delete('avatars/1.png');

    const command = send.mock.calls[0][0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'avatars/1.png',
    });
  });

  it('signs download and upload URLs that expire', async () => {
    const service = new StorageService(new ConfigService(env));

    const download = new URL(await service.getDownloadUrl('a/b.pdf', 60));
    const upload = new URL(
      await service.getUploadUrl('a/b.pdf', 'application/pdf'),
    );

    expect(download.hostname).toBe('test-bucket.s3.eu-north-1.amazonaws.com');
    expect(download.pathname).toBe('/a/b.pdf');
    expect(download.searchParams.get('X-Amz-Expires')).toBe('60');
    expect(upload.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(send).not.toHaveBeenCalled();
  });

  it('uses a custom endpoint with path-style URLs (MinIO)', async () => {
    const service = new StorageService(
      new ConfigService({ ...env, S3_ENDPOINT: 'http://localhost:9000' }),
    );

    const url = new URL(await service.getDownloadUrl('a.txt'));

    expect(url.origin).toBe('http://localhost:9000');
    expect(url.pathname).toBe('/test-bucket/a.txt');
  });

  it('fails at startup when required env is missing', () => {
    expect(
      () =>
        new StorageService(new ConfigService({ ...env, S3_BUCKET: undefined })),
    ).toThrow(/S3_BUCKET/);
  });
});
