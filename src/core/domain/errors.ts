/**
 * Catálogo e contratos padronizados de erros da aplicação.
 * Mapeia erros semânticos para códigos estáveis e status HTTP correspondentes.
 * Conforme RFC 9110 e especificação em docs/plano-erros-http-autorizacao.md.
 */

export type DomainErrorCode =
  | 'BAD_REQUEST'
  | 'AUTHENTICATION_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SLOT_CONFLICT'
  | 'PAYMENT_ALREADY_CONFIRMED'
  | 'VALIDATION_ERROR'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface StructuredErrorResponse {
  success: false;
  code: DomainErrorCode;
  status: number;
  error: string;
  fields?: Record<string, string>;
  correlationId?: string;
}

export class AppError extends Error {
  public readonly code: DomainErrorCode;
  public readonly status: number;
  public readonly fields?: Record<string, string>;

  constructor(message: string, code: DomainErrorCode, status: number, fields?: Record<string, string>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.fields = fields;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponse(): StructuredErrorResponse {
    return {
      success: false,
      code: this.code,
      status: this.status,
      error: this.message,
      ...(this.fields ? { fields: this.fields } : {}),
    };
  }
}

export class AuthenticationRequiredError extends AppError {
  constructor(message: string = 'Entre na sua conta para continuar.') {
    super(message, 'AUTHENTICATION_REQUIRED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Sua conta não tem permissão para acessar esta área ou executar esta operação.') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'O registro solicitado não foi encontrado.') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: 'SLOT_CONFLICT' | 'PAYMENT_ALREADY_CONFIRMED' = 'SLOT_CONFLICT') {
    super(message, code, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 422, fields);
  }
}

export type ActionSuccess<T = Record<string, unknown>> = T & {
  success: true;
  error?: undefined;
};

export type ActionResult<T = Record<string, unknown>> =
  | ActionSuccess<T>
  | StructuredErrorResponse;

export function actionSuccess<T extends Record<string, unknown>>(data: T): ActionSuccess<T> {
  return {
    ...data,
    success: true,
    error: undefined,
  };
}

export function authRequiredResponse(message = 'Entre na sua conta para continuar.'): StructuredErrorResponse {
  return { success: false, code: 'AUTHENTICATION_REQUIRED', status: 401, error: message };
}

export function forbiddenResponse(message = 'Sua conta não tem permissão para acessar esta área ou executar esta operação.'): StructuredErrorResponse {
  return { success: false, code: 'FORBIDDEN', status: 403, error: message };
}

export function notFoundResponse(message = 'O registro solicitado não foi encontrado.'): StructuredErrorResponse {
  return { success: false, code: 'NOT_FOUND', status: 404, error: message };
}

export function conflictResponse(
  message: string,
  code: 'SLOT_CONFLICT' | 'PAYMENT_ALREADY_CONFIRMED' = 'SLOT_CONFLICT'
): StructuredErrorResponse {
  return { success: false, code, status: 409, error: message };
}

export function validationResponse(message: string, fields?: Record<string, string>): StructuredErrorResponse {
  return { success: false, code: 'VALIDATION_ERROR', status: 422, error: message, ...(fields ? { fields } : {}) };
}

export function internalErrorResponse(message = 'Ocorreu um erro inesperado no servidor.'): StructuredErrorResponse {
  return { success: false, code: 'INTERNAL_ERROR', status: 500, error: message };
}

export function toStructuredError(error: unknown, fallbackMessage = 'Ocorreu um erro inesperado no servidor.'): StructuredErrorResponse {
  if (error instanceof AppError) {
    return error.toResponse();
  }
  const err = error as Error & { status?: number; code?: string };
  if (err?.status === 409 || err?.message?.toLowerCase().includes('conflito') || err?.message?.toLowerCase().includes('reservado')) {
    return conflictResponse(err.message || 'Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.');
  }
  if (err?.status === 404 || err?.message?.toLowerCase().includes('não encontrado')) {
    return notFoundResponse(err.message);
  }
  if (err?.status === 403 || err?.message?.toLowerCase().includes('acesso negado') || err?.message?.toLowerCase().includes('não autorizado')) {
    return forbiddenResponse(err.message);
  }
  return internalErrorResponse(err?.message || fallbackMessage);
}
