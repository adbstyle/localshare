/**
 * Manual test file for url-filters utilities
 * Run with: npx tsx apps/frontend/src/lib/utils/__tests__/manual-test.ts
 */

import { parseFiltersFromURL, buildURLFromFilters, areFiltersEqual, getPageFromURL } from '../url-filters';
import { ListingType, ListingCategory } from '@localshare/shared';

console.log('🧪 Testing URL Filters Utilities\n');

// Test 1: parseFiltersFromURL with empty params
console.log('Test 1: Parse empty URL');
const test1 = parseFiltersFromURL(new URLSearchParams(''));
console.log('Result:', test1);
console.log('✅ Expected: offset=0, limit=30, no filters\n');

// Test 2: parseFiltersFromURL with search
console.log('Test 2: Parse URL with search parameter');
const test2 = parseFiltersFromURL(new URLSearchParams('?search=laptop'));
console.log('Result:', test2);
console.log('✅ Expected: search="laptop"\n');

// Test 3: parseFiltersFromURL with page
console.log('Test 3: Parse URL with page=3');
const test3 = parseFiltersFromURL(new URLSearchParams('?page=3'));
console.log('Result:', test3);
console.log('✅ Expected: offset=60 (page 3 * 30 items)\n');

// Test 4: parseFiltersFromURL with multiple types
console.log('Test 4: Parse URL with multiple types');
const test4 = parseFiltersFromURL(new URLSearchParams('?types=SELL&types=RENT'));
console.log('Result:', test4);
console.log('✅ Expected: types=["SELL", "RENT"]\n');

// Test 5: parseFiltersFromURL with invalid values
console.log('Test 5: Parse URL with invalid type values');
const test5 = parseFiltersFromURL(new URLSearchParams('?types=SELL&types=INVALID&types=RENT'));
console.log('Result:', test5);
console.log('✅ Expected: types=["SELL", "RENT"] (INVALID filtered out)\n');

// Test 6: parseFiltersFromURL with all parameters
console.log('Test 6: Parse complete URL');
const test6 = parseFiltersFromURL(
  new URLSearchParams('?page=2&search=be&myListings=true&types=SELL&categories=ELECTRONICS')
);
console.log('Result:', test6);
console.log('✅ Expected: page=2, search="be", myListings=true, types=["SELL"], categories=["ELECTRONICS"]\n');

// Test 7: buildURLFromFilters with empty filters
console.log('Test 7: Build URL with no filters');
const test7 = buildURLFromFilters({}, new URLSearchParams(), 1);
console.log('Result:', test7);
console.log('✅ Expected: "page=1"\n');

// Test 8: buildURLFromFilters with search
console.log('Test 8: Build URL with search');
const test8 = buildURLFromFilters({ search: 'laptop' }, new URLSearchParams(), 1);
console.log('Result:', test8);
console.log('✅ Expected: contains "search=laptop"\n');

// Test 9: buildURLFromFilters with all parameters
console.log('Test 9: Build complete URL');
const test9 = buildURLFromFilters(
  {
    search: 'be',
    types: [ListingType.SELL, ListingType.RENT],
    categories: [ListingCategory.ELECTRONICS],
    myListings: true,
  },
  new URLSearchParams(),
  2
);
console.log('Result:', test9);
console.log('✅ Expected: page=2&search=be&types=SELL&types=RENT&categories=ELECTRONICS&myListings=true\n');

// Test 10: areFiltersEqual with same filters
console.log('Test 10: Compare equal filters');
const filter10a = {
  search: 'laptop',
  types: [ListingType.SELL],
  categories: [ListingCategory.ELECTRONICS],
  myListings: true,
  limit: 30,
  offset: 0,
};
const filter10b = { ...filter10a };
const test10 = areFiltersEqual(filter10a, filter10b);
console.log('Result:', test10);
console.log('✅ Expected: true\n');

// Test 11: areFiltersEqual with different order
console.log('Test 11: Compare filters with types in different order');
const filter11a = {
  types: [ListingType.SELL, ListingType.RENT],
  limit: 30,
  offset: 0,
};
const filter11b = {
  types: [ListingType.RENT, ListingType.SELL],
  limit: 30,
  offset: 0,
};
const test11 = areFiltersEqual(filter11a, filter11b);
console.log('Result:', test11);
console.log('✅ Expected: true (order should not matter)\n');

// Test 12: areFiltersEqual with different filters
console.log('Test 12: Compare different filters');
const filter12a = { search: 'laptop', limit: 30, offset: 0 };
const filter12b = { search: 'camera', limit: 30, offset: 0 };
const test12 = areFiltersEqual(filter12a, filter12b);
console.log('Result:', test12);
console.log('✅ Expected: false\n');

// Test 13: getPageFromURL
console.log('Test 13: Get page from URL');
const test13 = getPageFromURL(new URLSearchParams('?page=5'));
console.log('Result:', test13);
console.log('✅ Expected: 5\n');

// Test 14: getPageFromURL with invalid value
console.log('Test 14: Get page from invalid URL');
const test14 = getPageFromURL(new URLSearchParams('?page=abc'));
console.log('Result:', test14);
console.log('✅ Expected: 1 (default)\n');

// Test 15: Round-trip test (parse → build → parse)
console.log('Test 15: Round-trip test');
const originalURL = '?page=2&search=be&myListings=true&types=SELL&types=RENT&categories=ELECTRONICS';
const parsed = parseFiltersFromURL(new URLSearchParams(originalURL));
const rebuilt = buildURLFromFilters(parsed, new URLSearchParams(), 2);
const reparsed = parseFiltersFromURL(new URLSearchParams(rebuilt));
const isEqual = areFiltersEqual(parsed, reparsed);
console.log('Original URL:', originalURL);
console.log('Rebuilt URL:', rebuilt);
console.log('Filters are equal:', isEqual);
console.log('✅ Expected: true (round-trip should preserve all data)\n');

console.log('🎉 All manual tests completed!');
console.log('\nTo verify:');
console.log('1. Check that all outputs match expected values');
console.log('2. Verify no TypeScript errors');
console.log('3. Confirm filter validation works (invalid types filtered out)');
