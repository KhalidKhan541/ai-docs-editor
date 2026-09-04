export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  requestId?: string;
}

export interface APIMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface APIRequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export type HTTPStatus =
  | 200
  | 201
  | 204
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503;

export interface APIEndpoints {
  auth: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    forgotPassword: string;
    resetPassword: string;
  };
  documents: {
    list: string;
    get: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    duplicate: (id: string) => string;
    share: (id: string) => string;
    versions: (id: string) => string;
    export: (id: string) => string;
  };
  comments: {
    list: (documentId: string) => string;
    create: (documentId: string) => string;
    update: (documentId: string, commentId: string) => string;
    delete: (documentId: string, commentId: string) => string;
    resolve: (documentId: string, threadId: string) => string;
  };
  ai: {
    complete: string;
    suggest: string;
    history: string;
    usage: string;
    quota: string;
  };
  templates: {
    list: string;
    get: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    use: (id: string) => string;
  };
  users: {
    me: string;
    update: string;
    avatar: string;
    preferences: string;
  };
  billing: {
    plans: string;
    subscription: string;
    invoices: string;
    paymentMethod: string;
  };
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  senderId: string;
}

export interface WSEditorMessage {
  type:
    | "block:update"
    | "block:create"
    | "block:delete"
    | "block:move"
    | "cursor:move"
    | "selection:update"
    | "presence:update"
    | "comment:create"
    | "comment:update"
    | "comment:resolve";
  payload: unknown;
  documentId: string;
  timestamp: string;
  senderId: string;
  version: number;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  alt?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface BatchOperationRequest<T> {
  operations: Array<{
    method: "create" | "update" | "delete";
    id?: string;
    data: T;
  }>;
}

export interface BatchOperationResponse {
  results: Array<{
    success: boolean;
    id?: string;
    error?: APIError;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}
