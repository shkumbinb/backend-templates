import { ConfigService } from '@nestjs/config';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Options } from 'pino-http';
import { loggerConfig, requestId } from './logger.config';

function pinoOptions(env: Record<string, string>): Options {
  return loggerConfig(new ConfigService(env)).pinoHttp as Options;
}

describe('loggerConfig', () => {
  it('defaults to info with JSON output', () => {
    const options = pinoOptions({});
    expect(options.level).toBe('info');
    expect(options.transport).toBeUndefined();
  });

  it('uses LOG_LEVEL and readable output in development', () => {
    const options = pinoOptions({
      LOG_LEVEL: 'debug',
      NODE_ENV: 'development',
    });
    expect(options.level).toBe('debug');
    expect(options.transport).toMatchObject({ target: 'pino-pretty' });
  });

  it('hides auth headers and cookies', () => {
    expect(pinoOptions({}).redact).toMatchObject({
      paths: expect.arrayContaining([
        'req.headers.authorization',
        'req.headers.cookie',
      ]) as unknown,
    });
  });
});

describe('requestId', () => {
  const call = (header?: string) => {
    const res = { setHeader: jest.fn() };
    const id = requestId(
      { headers: { 'x-request-id': header } } as unknown as IncomingMessage,
      res as unknown as ServerResponse,
    );
    return { id, res };
  };

  it('reuses a valid incoming request id and echoes it back', () => {
    const { id, res } = call('abc-123');
    expect(id).toBe('abc-123');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'abc-123');
  });

  it('generates a new id when missing or invalid', () => {
    expect(call().id).toMatch(/^[0-9a-f-]{36}$/);
    expect(call('bad id\nwith newline').id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
