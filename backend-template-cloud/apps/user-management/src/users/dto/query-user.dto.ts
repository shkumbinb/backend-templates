import { PaginationQueryDto, ToArray } from '@wayland/query';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export const USER_SORT_FIELDS = ['createdAt', 'email', 'name'] as const;

/**
 * Query of `GET /users`. Sending `page` returns a paginated response,
 * otherwise the full list is returned.
 */
export class QueryUserDto extends PaginationQueryDto {
  /** Partial match on email or name. */
  @IsOptional()
  @IsString()
  search?: string;

  /** Partial match on name. */
  @IsOptional()
  @IsString()
  name?: string;

  /** Exact match, comma-separated or repeated: `?email=a@x.io,b@x.io`. */
  @IsOptional()
  @ToArray()
  @IsEmail({}, { each: true })
  email?: string[];

  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy: (typeof USER_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
