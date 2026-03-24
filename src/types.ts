export interface ErrorEntry {
  status: number;
  message: string;
}

export interface TypedCatalog<Codes extends string> {
  /**
   * Create a CatalogError for the given code.
   *
   * @param code - A registered error code
   * @param customMessage - Optional context appended after the default message
   * @returns A CatalogError instance (throw it yourself)
   */
  (code: Codes, customMessage?: string): import('./error.js').CatalogError;

  /**
   * Register new error codes. Throws if any code is already registered.
   * Returns a new typed callable that includes both old and new codes.
   */
  register<NewCodes extends string>(
    entries: Record<NewCodes, ErrorEntry>,
  ): TypedCatalog<Codes | NewCodes>;

  /**
   * Type-narrowing guard. Checks if an unknown error is a CatalogError with the given code.
   */
  is(error: unknown, code: Codes): error is import('./error.js').CatalogError;

  /**
   * Clear all registered codes. Useful for test isolation.
   */
  reset(): TypedCatalog<never>;
}
