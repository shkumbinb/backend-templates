import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppException, errorCodeFromStatus } from './app.exception';
import { mapPrismaError } from './prisma-error.mapper';

export interface ErrorResponse {
  statusCode: number;
  /** Machine-readable code clients can branch on, e.g. `NOT_FOUND` or `USER_NOT_FOUND`. */
  error: string;
  /** Human-readable message, safe to show to users. */
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

export interface ResolvedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      this.logger.error(
        `Unhandled ${host.getType()} exception`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      return;
    }

    const { httpAdapter } = this.adapterHost;
    const ctx = host.switchToHttp();
    const request: unknown = ctx.getRequest();
    const response: unknown = ctx.getResponse();

    const resolved = resolveException(exception);
    const body: ErrorResponse = {
      statusCode: resolved.status,
      error: resolved.code,
      message: resolved.message,
      ...(resolved.details !== undefined && { details: resolved.details }),
      path: httpAdapter.getRequestUrl(request) as string,
      timestamp: new Date().toISOString(),
    };

    const route = `${httpAdapter.getRequestMethod(request)} ${body.path}`;
    if (resolved.status >= 500) {
      this.logger.error(
        `${route} ${resolved.status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${route} ${resolved.status} ${resolved.code}: ${resolved.message}`,
      );
    }

    if (httpAdapter.isHeadersSent(response)) {
      return;
    }
    httpAdapter.reply(response, body, resolved.status);
  }
}

function resolveException(exception: unknown): ResolvedError {
  if (exception instanceof AppException) {
    return {
      status: exception.getStatus(),
      code: exception.code,
      message: exception.message,
      details: exception.details,
    };
  }

  if (exception instanceof HttpException) {
    return resolveHttpException(exception);
  }

  return (
    mapPrismaError(exception) ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    }
  );
}

function resolveHttpException(exception: HttpException): ResolvedError {
  const status = exception.getStatus();
  const code = errorCodeFromStatus(status);
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return { status, code, message: response };
  }

  const { message } = response as { message?: unknown };

  // ValidationPipe puts one message per invalid field into an array.
  if (Array.isArray(message)) {
    return {
      status,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      details: message,
    };
  }

  return {
    status,
    code,
    message: typeof message === 'string' ? message : exception.message,
  };
}
