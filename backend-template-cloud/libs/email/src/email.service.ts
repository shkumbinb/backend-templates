import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { emailConfig } from './email.config';

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
} & ({ text: string; html?: string } | { html: string; text?: string });

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const { from, ...smtp } = emailConfig(config);
    this.from = from;
    this.transporter = createTransport(smtp);
  }

  async send(options: SendEmailOptions): Promise<void> {
    const info = (await this.transporter.sendMail({
      from: this.from,
      ...options,
    })) as { messageId: string };
    // Recipients and content are personal data, so only the id is logged.
    this.logger.log(`Email sent: ${info.messageId}`);
  }

  /** Connects and authenticates without sending, e.g. for health checks. */
  async verify(): Promise<void> {
    await this.transporter.verify();
  }
}
