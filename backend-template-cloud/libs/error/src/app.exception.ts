import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppExceptionOptions {
  /** Defaults to the status name, e.g. `NOT_FOUND`. */
  code?: string;
  details?: unknown;
  cause?: unknown;
}

/**
 * @example
 * throw new AppException(HttpStatus.NOT_FOUND, 'User not found', {
 *   code: 'USER_NOT_FOUND',
 * });
 */
export class AppException extends HttpException {
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: HttpStatus,
    message: string,
    options: AppExceptionOptions = {},
  ) {
    super(message, status, { cause: options.cause });
    this.code = options.code ?? errorCodeFromStatus(status);
    this.details = options.details;
  }
}

export function errorCodeFromStatus(status: number): string {
  const name = (HttpStatus as Record<number, string | undefined>)[status];
  return name ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
}
