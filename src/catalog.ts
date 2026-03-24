import { CatalogError } from './error.js';
import type { ErrorEntry, TypedCatalog } from './types.js';

const registry = new Map<string, ErrorEntry>();

function createTypedCatalog<Codes extends string>(): TypedCatalog<Codes> {
  function callable(code: string, customMessage?: string): CatalogError {
    const entry = registry.get(code);
    if (!entry) {
      throw new Error(`[http-error-catalog] Unknown error code: "${code}"`);
    }
    const message = customMessage
      ? `${entry.message}: ${customMessage}`
      : entry.message;
    return new CatalogError(code, entry.status, message);
  }

  callable.register = <NewCodes extends string>(
    entries: Record<NewCodes, ErrorEntry>,
  ): TypedCatalog<Codes | NewCodes> => {
    for (const code of Object.keys(entries)) {
      if (registry.has(code)) {
        throw new Error(
          `[http-error-catalog] Duplicate error code: "${code}"`,
        );
      }
      registry.set(code, (entries as Record<string, ErrorEntry>)[code]);
    }
    return createTypedCatalog<Codes | NewCodes>();
  };

  callable.is = (error: unknown, code: string): error is CatalogError => {
    return error instanceof CatalogError && error.code === code;
  };

  callable.reset = (): TypedCatalog<never> => {
    registry.clear();
    return createTypedCatalog<never>();
  };

  return callable as unknown as TypedCatalog<Codes>;
}

export const httpErrorCatalog: TypedCatalog<never> = createTypedCatalog<never>();
