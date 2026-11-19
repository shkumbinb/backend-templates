import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AppException } from '@wayland/error';
import {
  contains,
  inList,
  paginate,
  Paginated,
  searchIn,
} from '@wayland/query';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity, userSelect } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateUserDto): Promise<UserEntity> {
    return this.prisma.user.create({ data: dto, select: userSelect });
  }

  async findAll(
    query: QueryUserDto,
  ): Promise<UserEntity[] | Paginated<UserEntity>> {
    const where: Prisma.UserWhereInput = {
      email: inList(query.email),
      name: contains(query.name),
      OR: searchIn(query.search, ['email', 'name']),
    };
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    if (query.page === undefined) {
      return this.prisma.user.findMany({ where, orderBy, select: userSelect });
    }

    return paginate(query, ({ skip, take }) =>
      this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          orderBy,
          skip,
          take,
          select: userSelect,
        }),
        this.prisma.user.count({ where }),
      ]),
    );
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      throw new AppException(HttpStatus.NOT_FOUND, 'User not found');
    }
    return user;
  }

  // A missing id makes Prisma throw P2025, which @wayland/error turns into a 404.
  update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: userSelect,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
