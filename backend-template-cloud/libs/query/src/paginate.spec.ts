import { paginate } from './paginate';

describe('paginate', () => {
  it('turns page and limit into skip and take', async () => {
    const fetch = jest.fn().mockResolvedValue([['c', 'd'], 5]);

    const result = await paginate({ page: 2, limit: 2 }, fetch);

    expect(fetch).toHaveBeenCalledWith({ skip: 2, take: 2 });
    expect(result).toEqual({
      data: ['c', 'd'],
      meta: { total: 5, page: 2, limit: 2, totalPages: 3 },
    });
  });

  it('uses the defaults when page and limit are missing', async () => {
    const fetch = jest.fn().mockResolvedValue([[], 0]);

    const result = await paginate({}, fetch);

    expect(fetch).toHaveBeenCalledWith({ skip: 0, take: 20 });
    expect(result.meta).toEqual({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });
});
