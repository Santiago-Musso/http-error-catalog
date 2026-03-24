import { describe, it, expect, beforeEach, vi } from 'vitest';
import { httpErrorCatalog } from '../src/index';
import { errorHandler } from '../src/express/index';

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function createMockReq(overrides: Record<string, any> = {}) {
  return { path: '/test', ...overrides } as any;
}

describe('express errorHandler', () => {
  let errors: ReturnType<typeof httpErrorCatalog.reset>;

  beforeEach(() => {
    errors = httpErrorCatalog.reset();
  });

  it('handles CatalogError with correct status and body', () => {
    const catalog = errors.register({
      NOT_FOUND: { status: 404, message: 'Not found' },
    });

    const handler = errorHandler();
    const error = catalog('NOT_FOUND');
    const res = createMockRes();

    handler(error, createMockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Not found',
    });
  });

  it('handles CatalogError with custom message', () => {
    const catalog = errors.register({
      NOT_FOUND: { status: 404, message: 'Not found' },
    });

    const handler = errorHandler();
    const error = catalog('NOT_FOUND', 'user 42');
    const res = createMockRes();

    handler(error, createMockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Not found: user 42',
    });
  });

  it('returns 500 INTERNAL_ERROR for unknown errors', () => {
    const handler = errorHandler();
    const res = createMockRes();

    handler(new Error('something broke'), createMockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('returns 500 INTERNAL_ERROR for non-Error values', () => {
    const handler = errorHandler();
    const res = createMockRes();

    handler('a string error', createMockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('calls onError callback when provided', () => {
    const catalog = errors.register({
      BAD_REQUEST: { status: 400, message: 'Bad request' },
    });

    const onError = vi.fn();
    const handler = errorHandler({ onError });
    const error = catalog('BAD_REQUEST');
    const req = createMockReq();
    const res = createMockRes();

    handler(error, req, res, vi.fn());

    expect(onError).toHaveBeenCalledWith(error, req);
  });

  it('calls onError for unknown errors too', () => {
    const onError = vi.fn();
    const handler = errorHandler({ onError });
    const error = new Error('unknown');
    const req = createMockReq();
    const res = createMockRes();

    handler(error, req, res, vi.fn());

    expect(onError).toHaveBeenCalledWith(error, req);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
