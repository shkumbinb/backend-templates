import { contains, inList, searchIn } from './filters';

describe('filters', () => {
  it('inList', () => {
    expect(inList(['A', 'B'])).toEqual({ in: ['A', 'B'] });
    expect(inList([])).toBeUndefined();
    expect(inList(undefined)).toBeUndefined();
  });

  it('contains', () => {
    expect(contains('ann')).toEqual({ contains: 'ann', mode: 'insensitive' });
    expect(contains('')).toBeUndefined();
    expect(contains(undefined)).toBeUndefined();
  });

  it('searchIn', () => {
    expect(searchIn('ann', ['email', 'name'])).toEqual([
      { email: { contains: 'ann', mode: 'insensitive' } },
      { name: { contains: 'ann', mode: 'insensitive' } },
    ]);
    expect(searchIn(undefined, ['email'])).toBeUndefined();
  });
});
