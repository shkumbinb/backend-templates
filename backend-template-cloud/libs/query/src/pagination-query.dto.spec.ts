import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';
import { ToArray, ToBoolean } from './transforms';

class ExampleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ToArray()
  @IsIn(['ACTIVE', 'PENDING'], { each: true })
  status?: string[];

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  active?: boolean;
}

describe('PaginationQueryDto with transforms', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const parse = (query: Record<string, unknown>) =>
    pipe.transform(query, {
      type: 'query',
      metatype: ExampleQueryDto,
    }) as Promise<ExampleQueryDto>;

  it('leaves page unset and defaults the limit', async () => {
    const result = await parse({});
    expect(result.page).toBeUndefined();
    expect(result.limit).toBe(20);
  });

  it('converts query strings to the right types', async () => {
    const result = await parse({
      page: '3',
      limit: '50',
      status: 'ACTIVE, PENDING',
      active: 'false',
    });
    expect(result).toMatchObject({
      page: 3,
      limit: 50,
      status: ['ACTIVE', 'PENDING'],
      active: false,
    });
  });

  it('accepts repeated query params as an array', async () => {
    const result = await parse({ status: ['ACTIVE', 'PENDING'] });
    expect(result.status).toEqual(['ACTIVE', 'PENDING']);
  });

  it.each([
    { limit: '101' },
    { page: '0' },
    { page: 'abc' },
    { status: 'ACTIVE,UNKNOWN' },
    { active: 'yes' },
    { unknownParam: 'x' },
  ])('rejects %p', async (query) => {
    await expect(parse(query)).rejects.toBeInstanceOf(BadRequestException);
  });
});
