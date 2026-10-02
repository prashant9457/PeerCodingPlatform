export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = "Resource not found",
    code: string = "NOT_FOUND"
  ) {
    super(message, 404, code, true);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = "Bad request",
    code: string = "BAD_REQUEST",
    details?: unknown
  ) {
    super(message, 400, code, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal server error",
    code: string = "INTERNAL_SERVER_ERROR"
  ) {
    super(message, 500, code, false);
  }
}
