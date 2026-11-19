import type { Prisma } from '@prisma/client';

/** The only columns the API returns. New sensitive columns stay hidden unless added here. */
export const userSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/** What the API returns for a user. */
export class UserEntity {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
