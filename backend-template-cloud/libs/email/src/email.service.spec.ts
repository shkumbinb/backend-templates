import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const env = {
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'user',
  SMTP_PASS: 'pass',
  SMTP_FROM: 'App <no-reply@example.com>',
};

describe('EmailService', () => {
  const transporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: '<id@example.com>' }),
    verify: jest.fn().mockResolvedValue(true),
  };
  const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createTransport).mockReturnValue(transporter as never);
  });

  it('creates the SMTP transport from env', () => {
    new EmailService(new ConfigService(env));
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'pass' },
    });
  });

  it('uses implicit TLS on port 465 and no auth without credentials', () => {
    new EmailService(
      new ConfigService({
        ...env,
        SMTP_PORT: '465',
        SMTP_USER: '',
        SMTP_PASS: '',
      }),
    );
    const smtp = jest.mocked(createTransport).mock.calls[0][0];
    expect(smtp).toMatchObject({ port: 465, secure: true });
    expect(smtp).not.toHaveProperty('auth');
  });

  it('sends from SMTP_FROM and logs only the message id', async () => {
    const service = new EmailService(new ConfigService(env));

    await service.send({ to: 'ann@example.com', subject: 'Hi', text: 'Hello' });

    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: 'App <no-reply@example.com>',
      to: 'ann@example.com',
      subject: 'Hi',
      text: 'Hello',
    });
    expect(log).toHaveBeenCalledWith('Email sent: <id@example.com>');
    expect(JSON.stringify(log.mock.calls)).not.toContain('ann@example.com');
  });

  it('fails at startup when required env is missing', () => {
    expect(
      () =>
        new EmailService(new ConfigService({ ...env, SMTP_HOST: undefined })),
    ).toThrow(/SMTP_HOST/);
    expect(
      () => new EmailService(new ConfigService({ ...env, SMTP_PORT: 'abc' })),
    ).toThrow('SMTP_PORT must be a number');
  });
});
