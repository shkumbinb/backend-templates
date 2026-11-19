import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppException } from './app.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

function prismaError(code: string, meta?: Record<string, unknown>): Error {
  const error = new Error('prisma failure') as Error & {
    code: string;
    meta?: Record<string, unknown>;
  };
  error.name = 'PrismaClientKnownRequestError';
  error.code = code;
  error.meta = meta;
  return error;
}

describe('AllExceptionsFilter', () => {
  const reply = jest.fn();
  const adapterHost = {
    httpAdapter: {
      reply,
      getRequestUrl: () => '/users/1',
      getRequestMethod: () => 'GET',
      isHeadersSent: () => false,
    },
  } as unknown as HttpAdapterHost;
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}) }),
  } as unknown as ArgumentsHost;

  const filter = new AllExceptionsFilter(adapterHost);

  const handle = (exception: unknown) => {
    filter.catch(exception, host);
    const [, body, status] = reply.mock.calls.at(-1) as [
      unknown,
      Record<string, unknown>,
      number,
    ];
    return { body, status };
  };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('uses the code, message and details of an AppException', () => {
    const { body, status } = handle(
      new AppException(HttpStatus.NOT_FOUND, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: { id: '1' },
      }),
    );

    expect(status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'USER_NOT_FOUND',
      message: 'User not found',
      details: { id: '1' },
      path: '/users/1',
    });
    expect(typeof body.timestamp).toBe('string');
  });

  it('defaults the AppException code to the status name', () => {
    const { body } = handle(new AppException(HttpStatus.FORBIDDEN, 'Nope'));
    expect(body.error).toBe('FORBIDDEN');
  });

  it('handles built-in Nest exceptions', () => {
    const { body, status } = handle(new NotFoundException('No such page'));
    expect(status).toBe(404);
    expect(body).toMatchObject({ error: 'NOT_FOUND', message: 'No such page' });
    expect(body).not.toHaveProperty('details');
  });

  it('turns ValidationPipe messages into details', () => {
    const { body, status } = handle(
      new BadRequestException(['email must be an email']),
    );
    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: 'VALIDATION_FAILED',
      message: 'Validation failed',
      details: ['email must be an email'],
    });
  });

  it('maps a Prisma unique violation to 409 with the fields', () => {
    const { body, status } = handle(
      prismaError('P2002', { target: ['email'] }),
    );
    expect(status).toBe(409);
    expect(body).toMatchObject({
      error: 'CONFLICT',
      message: 'A record with this email already exists',
      details: { fields: ['email'] },
    });
  });

  it('maps a Prisma unique violation without field info to 409', () => {
    const { body, status } = handle(
      prismaError('P2002', {
        driverAdapterError: {
          cause: { constraint: { index: 'users_email_key' } },
        },
      }),
    );
    expect(status).toBe(409);
    expect(body.message).toBe('A record with this value already exists');
    expect(body).not.toHaveProperty('details');
  });

  it('maps Prisma record-not-found to 404', () => {
    const { body, status } = handle(prismaError('P2025'));
    expect(status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('maps Prisma invalid input to 400', () => {
    const { status } = handle(prismaError('P2007'));
    expect(status).toBe(400);
  });

  it('hides the details of unknown errors', () => {
    const { body, status } = handle(new Error('password=secret leaked'));
    expect(status).toBe(500);
    expect(body).toMatchObject({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });

  it('treats unmapped Prisma errors as 500', () => {
    const { status } = handle(prismaError('P1001'));
    expect(status).toBe(500);
  });
});
