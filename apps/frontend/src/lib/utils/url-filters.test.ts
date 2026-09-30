import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ListingCategory, ListingType } from '@localshare/shared';
import { buildURLFromFilters, getPageFromURL, parseFiltersFromURL } from './url-filters';

describe('url filters', () => {
  it('round-trips filters through the URL', () => {
    const filters = {
      search: 'velo',
      types: [ListingType.SELL, ListingType.RENT],
      categories: [ListingCategory.SPORTS],
      bookmarked: true,
    };
    const query = buildURLFromFilters(filters, 2);

    assert.equal(query, 'page=2&search=velo&types=SELL&types=RENT&categories=SPORTS&bookmarked=true');
    const parsed = parseFiltersFromURL(new URLSearchParams(query), 30);
    assert.deepEqual(
      { search: parsed.search, types: parsed.types, categories: parsed.categories, bookmarked: parsed.bookmarked },
      { search: 'velo', types: ['SELL', 'RENT'], categories: ['SPORTS'], bookmarked: true },
    );
    assert.equal(parsed.offset, 30);
  });

  it('drops unknown enum values and invalid pages', () => {
    const parsed = parseFiltersFromURL(new URLSearchParams('types=SELL&types=HACK&page=-3'), 30);

    assert.deepEqual(parsed.types, ['SELL']);
    assert.equal(parsed.offset, 0);
    assert.equal(getPageFromURL(new URLSearchParams('page=abc')), 1);
  });
});
