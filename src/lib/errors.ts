export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ─── Authentication Errors ───────────────────────────────────────────────────

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", details?: Record<string, unknown>) {
    super(message, "AUTHENTICATION_ERROR", 401, true, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions", details?: Record<string, unknown>) {
    super(message, "AUTHORIZATION_ERROR", 403, true, details);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Invalid email or password") {
    super(message, "INVALID_CREDENTIALS", 401, true);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = "Token has expired") {
    super(message, "TOKEN_EXPIRED", 401, true);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid token") {
    super(message, "INVALID_TOKEN", 401, true);
  }
}

// ─── Validation Errors ───────────────────────────────────────────────────────

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message, "VALIDATION_ERROR", 400, true, { fieldErrors });
    this.fieldErrors = fieldErrors;
  }
}

// ─── Not Found Errors ────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, "NOT_FOUND", 404, true, { resource, id });
  }
}

export class DocumentNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Document", id);
    this.name = "DocumentNotFoundError";
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("User", id);
    this.name = "UserNotFoundError";
  }
}

export class BlockNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Block", id);
    this.name = "BlockNotFoundError";
  }
}

export class CommentNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Comment", id);
    this.name = "CommentNotFoundError";
  }
}

export class TemplateNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Template", id);
    this.name = "TemplateNotFoundError";
  }
}

export class OrganizationNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Organization", id);
    this.name = "OrganizationNotFoundError";
  }
}

export class FolderNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Folder", id);
    this.name = "FolderNotFoundError";
  }
}

// ─── Conflict Errors ─────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists", details?: Record<string, unknown>) {
    super(message, "CONFLICT", 409, true, details);
  }
}

export class DuplicateEmailError extends ConflictError {
  constructor(email: string) {
    super(`An account with email '${email}' already exists`, { email });
    this.name = "DuplicateEmailError";
  }
}

export class DuplicateSlugError extends ConflictError {
  constructor(slug: string) {
    super(`A resource with slug '${slug}' already exists`, { slug });
    this.name = "DuplicateSlugError";
  }
}

export class DocumentAlreadyPublishedError extends ConflictError {
  constructor(documentId: string) {
    super("Document is already published", { documentId });
    this.name = "DocumentAlreadyPublishedError";
  }
}

// ─── Permission Errors ───────────────────────────────────────────────────────

export class InsufficientPermissionsError extends AppError {
  constructor(required: string, current: string) {
    super(`Insufficient permissions. Required: ${required}, Current: ${current}`, "INSUFFICIENT_PERMISSIONS", 403, true, {
      required,
      current,
    });
    this.name = "InsufficientPermissionsError";
  }
}

export class DocumentNotSharedError extends AppError {
  constructor(userId: string, documentId: string) {
    super("You don't have access to this document", "DOCUMENT_NOT_SHARED", 403, true, {
      userId,
      documentId,
    });
    this.name = "DocumentNotSharedError";
  }
}

export class CommentPermissionError extends AppError {
  constructor() {
    super("You don't have permission to comment on this document", "COMMENT_PERMISSION_DENIED", 403);
    this.name = "CommentPermissionError";
  }
}

// ─── Rate Limit Errors ───────────────────────────────────────────────────────

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(`Rate limit exceeded. Please retry after ${retryAfter} seconds`, "RATE_LIMIT_EXCEEDED", 429, true, { retryAfter });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ─── External Service Errors ─────────────────────────────────────────────────

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string = "External service error", statusCode: number = 502) {
    super(`External service error (${service}): ${message}`, "EXTERNAL_SERVICE_ERROR", statusCode, true, { service });
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

export class AIProviderError extends ExternalServiceError {
  constructor(message: string = "AI provider error") {
    super("AI", message);
    this.name = "AIProviderError";
  }
}

export class StripeError extends ExternalServiceError {
  constructor(message: string = "Payment processing error") {
    super("Stripe", message);
    this.name = "StripeError";
  }
}

export class EmailServiceError extends ExternalServiceError {
  constructor(message: string = "Email service error") {
    super("Email", message);
    this.name = "EmailServiceError";
  }
}

export class FileUploadError extends ExternalServiceError {
  constructor(message: string = "File upload error") {
    super("FileUpload", message);
    this.name = "FileUploadError";
  }
}

// ─── Collaboration Errors ────────────────────────────────────────────────────

export class CollaborationError extends AppError {
  constructor(message: string = "Collaboration error", details?: Record<string, unknown>) {
    super(message, "COLLABORATION_ERROR", 500, true, details);
  }
}

export class DocumentLockError extends CollaborationError {
  constructor(documentId: string) {
    super("Document is locked by another user", { documentId });
    this.name = "DocumentLockError";
  }
}

export class SessionExpiredError extends CollaborationError {
  constructor() {
    super("Collaboration session has expired. Please reconnect.");
    this.name = "SessionExpiredError";
  }
}

// ─── Subscription Errors ─────────────────────────────────────────────────────

export class SubscriptionError extends AppError {
  constructor(message: string = "Subscription error", details?: Record<string, unknown>) {
    super(message, "SUBSCRIPTION_ERROR", 402, true, details);
  }
}

export class PlanLimitExceededError extends SubscriptionError {
  constructor(feature: string, limit: number) {
    super(`Plan limit exceeded for ${feature}. Maximum: ${limit}`, {
      feature,
      limit,
    });
    this.name = "PlanLimitExceededError";
  }
}

// ─── Error Handler ───────────────────────────────────────────────────────────

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === "PrismaClientKnownRequestError") {
      return handlePrismaError(error);
    }

    if (error.name === "ZodError") {
      return new ValidationError(error.message);
    }

    console.error("Unhandled error:", error);
    return new AppError("An unexpected error occurred", "INTERNAL_ERROR", 500, false);
  }

  return new AppError("An unknown error occurred", "UNKNOWN_ERROR", 500, false);
}

function handlePrismaError(error: Error): AppError {
  const message = error.message;

  if (message.includes("P2002")) {
    const field = message.match(/Unique constraint failed on the fields: \(([^)]+)\)/)?.[1] ?? "field";
    return new ConflictError(`A record with this ${field} already exists`, { field });
  }

  if (message.includes("P2025")) {
    return new NotFoundError("Record");
  }

  if (message.includes("P2003")) {
    return new ValidationError("Foreign key constraint failed");
  }

  if (message.includes("P2014")) {
    return new ValidationError("Required relation violation");
  }

  return new AppError(`Database error: ${message}`, "DATABASE_ERROR", 500, false);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return "INTERNAL_ERROR";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
