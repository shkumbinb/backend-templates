import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

const REQUEST_ID_HEADER = 'x-request-id';
const VALID_REQUEST_ID = /^[\w-]{1,100}$/;

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

/**
 * Env: `LOG_LEVEL` (default `info`), `NODE_ENV` (`development` = readable
 * output, anything else = JSON for log collectors).
 */
export function loggerConfig(config: ConfigService): Params {
  return {
    pinoHttp: {
      level: config.get<string>('LOG_LEVEL', 'info'),
      genReqId: requestId,
      redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
      ...(config.get<string>('NODE_ENV') === 'development' && {
        transport: { target: 'pino-pretty', options: { singleLine: true } },
      }),
    },
  };
}

/** Reuses the caller's `x-request-id` so one request can be followed across services. */
export function requestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id =
    typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming)
      ? incoming
      : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}
