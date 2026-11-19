interface ContainsFilter {
  contains: string;
  mode: 'insensitive';
}

/** One single-key object per field, so a misspelled field fails to type-check against Prisma's where input. */
type SearchClauses<F extends string> = {
  [K in F]: Record<K, ContainsFilter>;
}[F][];

/** `status: inList(query.status)` → `{ in: [...] }`, or no filter when empty. */
export function inList<T>(values: T[] | undefined): { in: T[] } | undefined {
  return values?.length ? { in: values } : undefined;
}

/** `name: contains(query.name)` → case-insensitive partial match, or no filter when empty. */
export function contains(
  value: string | undefined,
): ContainsFilter | undefined {
  return value ? { contains: value, mode: 'insensitive' } : undefined;
}

/** `OR: searchIn(query.search, ['email', 'name'])` → match the term in any of the fields. */
export function searchIn<F extends string>(
  term: string | undefined,
  fields: F[],
): SearchClauses<F> | undefined {
  const filter = contains(term);
  if (!filter) {
    return undefined;
  }
  return fields.map(
    (field) => ({ [field]: filter }) as Record<F, ContainsFilter>,
  );
}
