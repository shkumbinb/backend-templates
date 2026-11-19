import { Test, TestingModule } from '@nestjs/testing';
import { AppException } from '@wayland/error';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUserDto } from './dto/query-user.dto';
import { UsersService } from './users.service';

const user = {
  id: '6f1c2c1e-7a4c-4a8e-9a43-0c2f4b9e1a11',
  email: 'ann@example.com',
  name: 'Ann',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function query(overrides: Partial<QueryUserDto> = {}): QueryUserDto {
  return Object.assign(new QueryUserDto(), overrides);
}

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((calls: Promise<unknown>[]) => Promise.all(calls)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findAll', () => {
    it('returns the full list when page is not sent', async () => {
      prisma.user.findMany.mockResolvedValue([user]);

      const result = await service.findAll(query());

      expect(result).toEqual([user]);
      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({ skip: expect.anything() as unknown }),
      );
    });

    it('returns a paginated response when page is sent', async () => {
      prisma.user.findMany.mockResolvedValue([user]);
      prisma.user.count.mockResolvedValue(21);

      const result = await service.findAll(query({ page: 2, limit: 10 }));

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result).toEqual({
        data: [user],
        meta: { total: 21, page: 2, limit: 10, totalPages: 3 },
      });
    });

    it('builds the filters and sorting', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.findAll(
        query({
          search: 'ann',
          email: ['ann@example.com'],
          sortBy: 'email',
          sortOrder: 'asc',
        }),
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: { in: ['ann@example.com'] },
            name: undefined,
            OR: [
              { email: { contains: 'ann', mode: 'insensitive' } },
              { name: { contains: 'ann', mode: 'insensitive' } },
            ],
          },
          orderBy: { email: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the user', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(service.findOne(user.id)).resolves.toEqual(user);
    });

    it('throws a 404 when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne(user.id)).rejects.toMatchObject(
        new AppException(404, 'User not found'),
      );
    });
  });
});
