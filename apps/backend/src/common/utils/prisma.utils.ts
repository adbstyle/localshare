/**
 * Normalizes DTO for Prisma update operations.
 *
 * Prisma ignores undefined values in update operations (treats them as "don't update").
 * This function converts undefined to null so fields are actually updated to NULL in the database.
 *
 * @param dto - Data transfer object with potential undefined values
 * @returns DTO with undefined values converted to null
 *
 * @example
 * const dto = { firstName: 'John', phoneNumber: undefined };
 * undefinedToNull(dto); // { firstName: 'John', phoneNumber: null }
 */
export function undefinedToNull<T extends Record<string, any>>(dto: T): T {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(dto)) {
    result[key] = value === undefined ? null : value;
  }

  return result as T;
}
