export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * @example
 * return paginate(query, ({ skip, take }) =>
 *   this.prisma.$transaction([
 *     this.prisma.user.findMany({ where, skip, take }),
 *     this.prisma.user.count({ where }),
 *   ]),
 * );
 */
export async function paginate<T>(
  query: { page?: number; limit?: number },
  fetch: (args: { skip: number; take: number }) => Promise<[T[], number]>,
): Promise<Paginated<T>> {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;

  const [data, total] = await fetch({ skip: (page - 1) * limit, take: limit });

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
