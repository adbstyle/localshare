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

  // Parse bookmarked boolean
  const bookmarkedParam = searchParams.get('bookmarked');
  const bookmarked = bookmarkedParam === 'true' ? true : undefined;

  return {
    search,
    types: validTypes.length > 0 ? validTypes : undefined,
    categories: validCategories.length > 0 ? validCategories : undefined,
    myListings,
    bookmarked,
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
 * @param page - Page number to include in the URL (default: 1)
 * @returns URL search parameters string (without leading '?')
 *
 * @example
 * ```ts
 * const filters = { search: 'laptop', types: ['SELL', 'RENT'] };
 * const urlString = buildURLFromFilters(filters, 2);
 * // 'page=2&search=laptop&types=SELL&types=RENT'
 * ```
 */
export function buildURLFromFilters(
  filters: Partial<FilterListingsDto>,
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

  // Add bookmarked if true
  if (filters.bookmarked) {
    params.set('bookmarked', 'true');
  }

  return params.toString();
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
