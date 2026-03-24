export class CatalogError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'CatalogError';

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): { code: string; status: number; message: string } {
    return {
      code: this.code,
      status: this.status,
      message: this.message,
    };
  }
}
