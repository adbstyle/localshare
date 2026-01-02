import { FilterListingsDto, ListingType, ListingCategory } from '@localshare/shared';

/**
 * Parse URL search parameters into a FilterListingsDto object.
 *
 * This function safely extracts and validates filter parameters from the URL,
 * ensuring all values are properly typed and sanitized.
 *
 * @param searchParams - URLSearchParams object from Next.js useSearchParams()
 * @param itemsPerPage - Number of items per page for pagination (default: 30)
 * @returns FilterListingsDto object with validated filter values
 *
 * @example
 * ```ts
 * const searchParams = new URLSearchParams('?page=2&search=laptop&types=SELL');
 * const filters = parseFiltersFromURL(searchParams);
 * // { search: 'laptop', types: ['SELL'], limit: 30, offset: 30 }
 * ```
 */
export function parseFiltersFromURL(
  searchParams: URLSearchParams,
  itemsPerPage: number = 30
): FilterListingsDto {
  // Parse and validate page number
  const pageParam = searchParams.get('page');
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const validPage = isNaN(page) ? 1 : page;

  // Parse search string
  const search = searchParams.get('search') || undefined;

  // Parse and validate types (filter out invalid enum values)
  const typesParam = searchParams.getAll('types');
  const validTypes = typesParam.filter((type) =>
    Object.values(ListingType).includes(type as ListingType)
  ) as ListingType[];

  // Parse and validate categories (filter out invalid enum values)
  const categoriesParam = searchParams.getAll('categories');
  const validCategories = categoriesParam.filter((cat) =>
    Object.values(ListingCategory).includes(cat as ListingCategory)
  ) as ListingCategory[];

  // Parse myListings boolean
  const myListingsParam = searchParams.get('myListings');
  const myListings = myListingsParam === 'true' ? true : undefined;

  return {
    search,
    types: validTypes.length > 0 ? validTypes : undefined,
    categories: validCategories.length > 0 ? validCategories : undefined,
    myListings,
    limit: itemsPerPage,
    offset: (validPage - 1) * itemsPerPage,
  };
}

/**
 * Build a URL search parameters string from filter values.
 *
 * This function creates a clean URL by omitting undefined/false values and
 * properly encoding all parameters.
 *
 * @param filters - Partial filter object to include in the URL
 * @param currentParams - Reserved for future use (e.g., preserving additional query params).
 *                        Currently unused but maintained for API stability. This parameter
 *                        allows for future enhancements such as merging filter params with
 *                        existing non-filter params without breaking the current API.
 * @param page - Page number to include in the URL (default: 1)
 * @returns URL search parameters string (without leading '?')
 *
 * @example
 * ```ts
 * const filters = { search: 'laptop', types: ['SELL', 'RENT'] };
 * const urlString = buildURLFromFilters(filters, new URLSearchParams(), 2);
 * // 'page=2&search=laptop&types=SELL&types=RENT'
 * ```
 */
export function buildURLFromFilters(
  filters: Partial<FilterListingsDto>,
  currentParams: URLSearchParams,
  page: number = 1
): string {
  const params = new URLSearchParams();

  // Always include page (default to 1 if invalid)
  const validPage = Math.max(1, page);
  params.set('page', validPage.toString());

  // Add search parameter if present
  if (filters.search) {
    params.set('search', filters.search);
  }

  // Add types as multiple parameters
  if (filters.types && filters.types.length > 0) {
    filters.types.forEach((type) => {
      params.append('types', type);
    });
  }

  // Add categories as multiple parameters
  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach((cat) => {
      params.append('categories', cat);
    });
  }

  // Add myListings if true
  if (filters.myListings) {
    params.set('myListings', 'true');
  }

  return params.toString();
}

/**
 * Compare two FilterListingsDto objects for equality.
 *
 * This function performs a deep comparison of filter objects, including
 * array comparisons for types and categories. Useful for optimization
 * to prevent unnecessary re-renders or API calls.
 *
 * @param a - First filter object to compare
 * @param b - Second filter object to compare
 * @returns true if filters are equal, false otherwise
 *
 * @example
 * ```ts
 * const filters1 = { search: 'laptop', types: ['SELL', 'RENT'] };
 * const filters2 = { search: 'laptop', types: ['RENT', 'SELL'] };
 * areFiltersEqual(filters1, filters2); // true (order doesn't matter)
 * ```
 */
export function areFiltersEqual(
  a: FilterListingsDto,
  b: FilterListingsDto
): boolean {
  // Compare primitive values
  if (a.search !== b.search) return false;
  if (a.myListings !== b.myListings) return false;
  if (a.limit !== b.limit) return false;
  if (a.offset !== b.offset) return false;

  // Compare types arrays (order-independent)
  const aTypes = a.types ? [...a.types].sort() : [];
  const bTypes = b.types ? [...b.types].sort() : [];
  if (aTypes.length !== bTypes.length) return false;
  if (aTypes.some((type, i) => type !== bTypes[i])) return false;

  // Compare categories arrays (order-independent)
  const aCategories = a.categories ? [...a.categories].sort() : [];
  const bCategories = b.categories ? [...b.categories].sort() : [];
  if (aCategories.length !== bCategories.length) return false;
  if (aCategories.some((cat, i) => cat !== bCategories[i])) return false;

  return true;
}

/**
 * Get the current page number from URL search parameters.
 *
 * @param searchParams - URLSearchParams object
 * @returns Validated page number (minimum 1)
 *
 * @example
 * ```ts
 * const searchParams = new URLSearchParams('?page=2');
 * const page = getPageFromURL(searchParams); // 2
 * ```
 */
export function getPageFromURL(searchParams: URLSearchParams): number {
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  return isNaN(page) ? 1 : Math.max(1, page);
}
