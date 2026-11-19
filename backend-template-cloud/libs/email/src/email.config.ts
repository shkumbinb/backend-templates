import { ConfigService } from '@nestjs/config';

export interface EmailConfig {
  host: string;
  port: number;
  /** Implicit TLS on port 465; other ports upgrade with STARTTLS. */
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
}

/** Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` (required), `SMTP_USER`, `SMTP_PASS` (optional). */
export function emailConfig(config: ConfigService): EmailConfig {
  const port = Number(config.getOrThrow<string>('SMTP_PORT'));
  if (!Number.isInteger(port)) {
    throw new Error('SMTP_PORT must be a number');
  }

  const user = config.get<string>('SMTP_USER');
  const pass = config.get<string>('SMTP_PASS');

  return {
    host: config.getOrThrow<string>('SMTP_HOST'),
    port,
    secure: port === 465,
    ...(user && pass && { auth: { user, pass } }),
    from: config.getOrThrow<string>('SMTP_FROM'),
  };
}
