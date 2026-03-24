import { describe, it, expect, beforeEach } from 'vitest';
import { httpErrorCatalog, CatalogError } from '../src/index.js';

describe('httpErrorCatalog', () => {
  let errors: ReturnType<typeof httpErrorCatalog.reset>;

  beforeEach(() => {
    errors = httpErrorCatalog.reset();
  });

  describe('register', () => {
    it('registers error codes and returns a typed callable', () => {
      const catalog = errors.register({
        NOT_FOUND: { status: 404, message: 'Not found' },
      });

      const error = catalog('NOT_FOUND');
      expect(error).toBeInstanceOf(CatalogError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
    });

    it('supports chaining multiple register calls', () => {
      const catalog = errors
        .register({
          NOT_FOUND: { status: 404, message: 'Not found' },
        })
        .register({
          UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
        });

      const notFound = catalog('NOT_FOUND');
      expect(notFound.code).toBe('NOT_FOUND');
      expect(notFound.status).toBe(404);

      const unauthorized = catalog('UNAUTHORIZED');
      expect(unauthorized.code).toBe('UNAUTHORIZED');
      expect(unauthorized.status).toBe(401);
    });

    it('throws on duplicate error codes', () => {
      errors.register({
        NOT_FOUND: { status: 404, message: 'Not found' },
      });

      expect(() =>
        errors.register({
          NOT_FOUND: { status: 404, message: 'Not found' },
        }),
      ).toThrow('[http-error-catalog] Duplicate error code: "NOT_FOUND"');
    });
  });

  describe('create error', () => {
    it('creates a CatalogError with default message', () => {
      const catalog = errors.register({
        NOT_FOUND: { status: 404, message: 'Resource not found' },
      });

      const error = catalog('NOT_FOUND');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CatalogError);
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('CatalogError');
    });

    it('concatenates custom message after default', () => {
      const catalog = errors.register({
        NOT_FOUND: { status: 404, message: 'Resource not found' },
      });

      const error = catalog('NOT_FOUND', 'for user 123');
      expect(error.message).toBe('Resource not found: for user 123');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
    });

    it('throws on unknown error code', () => {
      const catalog = errors.register({
        NOT_FOUND: { status: 404, message: 'Not found' },
      });

      expect(() => (catalog as any)('UNKNOWN_CODE')).toThrow(
        '[http-error-catalog] Unknown error code: "UNKNOWN_CODE"',
      );
    });

    it('error has a proper stack trace', () => {
      const catalog = errors.register({
        BAD_REQUEST: { status: 400, message: 'Bad request' },
      });

      const error = catalog('BAD_REQUEST');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('CatalogError');
    });
  });

  describe('is', () => {
    it('returns true for matching CatalogError', () => {
      const catalog = errors.register({
        NOT_FOUND: { status: 404, message: 'Not found' },
      });

      const error = catalog('NOT_FOUND');
      expect(catalog.is(error, 'NOT_FOUND')).toBe(true);
    });

    it('returns false for non-matching code', () => {
      const catalog = errors
        .register({
          NOT_FOUND: { status: 404, message: 'Not found' },
        })
        .register({
          UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
        });

      const error = catalog('NOT_FOUND');
      expect(catalog.is(error, 'UNAUTHORIZED')).toBe(false);
    });

    it('returns false for non-CatalogError', () => {
      const catalog = errors.register({
        NOT_FOUND: { status: 404, message: 'Not found' },
      });

      expect(catalog.is(new Error('random'), 'NOT_FOUND')).toBe(false);
      expect(catalog.is('string', 'NOT_FOUND')).toBe(false);
      expect(catalog.is(null, 'NOT_FOUND')).toBe(false);
      expect(catalog.is(undefined, 'NOT_FOUND')).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears all registered codes', () => {
      errors.register({
        NOT_FOUND: { status: 404, message: 'Not found' },
      });

      const fresh = errors.reset();

      // Can register the same code again after reset
      const catalog = fresh.register({
        NOT_FOUND: { status: 404, message: 'Not found' },
      });

      expect(catalog('NOT_FOUND').code).toBe('NOT_FOUND');
    });
  });

  describe('toJSON', () => {
    it('serializes the error to a plain object', () => {
      const catalog = errors.register({
        BAD_REQUEST: { status: 400, message: 'Bad request' },
      });

      const error = catalog('BAD_REQUEST', 'missing field');
      expect(error.toJSON()).toEqual({
        code: 'BAD_REQUEST',
        status: 400,
        message: 'Bad request: missing field',
      });
    });
  });
});
