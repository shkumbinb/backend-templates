import { Transform } from 'class-transformer';

/** `?status=A,B` or `?status=A&status=B` → `['A', 'B']`. */
export function ToArray(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return splitList(value);
    }
    if (Array.isArray(value)) {
      return value.flatMap((item: unknown) =>
        typeof item === 'string' ? splitList(item) : [item],
      );
    }
    return value;
  });
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** `?active=true` → `true`. Anything else is left as-is so `@IsBoolean()` can reject it. */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });
}
