import { HttpStatus } from '@nestjs/common';
import type { ResolvedError } from './all-exceptions.filter';

interface PrismaKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

// Matched by name rather than `instanceof` so the library does not depend on
// any app's generated Prisma client.
function isPrismaKnownRequestError(
  error: unknown,
): error is PrismaKnownRequestError {
  return (
    error instanceof Error &&
    error.name === 'PrismaClientKnownRequestError' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

/** Returns `undefined` for errors that should stay a 500. */
export function mapPrismaError(error: unknown): ResolvedError | undefined {
  if (!isPrismaKnownRequestError(error)) {
    return undefined;
  }

  switch (error.code) {
    case 'P2002': {
      const fields = uniqueConstraintFields(error.meta);
      return {
        status: HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: fields
          ? `A record with this ${fields.join(', ')} already exists`
          : 'A record with this value already exists',
        ...(fields && { details: { fields } }),
      };
    }
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        message: 'Record not found',
      };
    case 'P2003':
    case 'P2014':
      return {
        status: HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'The operation conflicts with a related record',
      };
    case 'P2000':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'BAD_REQUEST',
        message: 'A value is too long for its field',
      };
    case 'P2006':
    case 'P2007':
    case 'P2023':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'BAD_REQUEST',
        message: 'Invalid input value',
      };
    default:
      return undefined;
  }
}

function uniqueConstraintFields(
  meta: Record<string, unknown> | undefined,
): string[] | undefined {
  const target = meta?.['target'];
  if (Array.isArray(target) && target.length > 0) {
    return target.map(String);
  }

  // With driver adapters (Prisma 7) the fields are nested under the adapter error.
  const adapterError = meta?.['driverAdapterError'] as
    { cause?: { constraint?: { fields?: unknown } } } | undefined;
  const fields = adapterError?.cause?.constraint?.fields;
  if (Array.isArray(fields) && fields.length > 0) {
    return fields.map(String);
  }

  return undefined;
}
