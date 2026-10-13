import { describe, expect, it } from 'vitest';
import {
  AppError,
  AuthenticationRequiredError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  authRequiredResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationResponse,
  internalErrorResponse,
  toStructuredError,
} from './errors';

describe('Domain Errors & Structured Responses', () => {
  it('instantiates AppError subclasses with correct status and codes', () => {
    const baseErr = new AppError('Erro base', 'BAD_REQUEST', 400);
    expect(baseErr.status).toBe(400);
    expect(baseErr.code).toBe('BAD_REQUEST');
    expect(baseErr.message).toBe('Erro base');

    const authErr = new AuthenticationRequiredError('Faça login.');
    expect(authErr.status).toBe(401);
    expect(authErr.code).toBe('AUTHENTICATION_REQUIRED');
    expect(authErr.message).toBe('Faça login.');

    const forbErr = new ForbiddenError('Sem acesso.');
    expect(forbErr.status).toBe(403);
    expect(forbErr.code).toBe('FORBIDDEN');

    const notFoundErr = new NotFoundError('Inexistente.');
    expect(notFoundErr.status).toBe(404);
    expect(notFoundErr.code).toBe('NOT_FOUND');

    const conflictErr = new ConflictError('Vaga ocupada.');
    expect(conflictErr.status).toBe(409);
    expect(conflictErr.code).toBe('SLOT_CONFLICT');

    const valErr = new ValidationError('Campo inválido.', { email: 'Inválido' });
    expect(valErr.status).toBe(422);
    expect(valErr.code).toBe('VALIDATION_ERROR');
    expect(valErr.fields).toEqual({ email: 'Inválido' });
  });

  it('generates structured error responses correctly', () => {
    expect(authRequiredResponse('Sessão expirada')).toEqual({
      success: false,
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
      error: 'Sessão expirada',
    });

    expect(forbiddenResponse('Acesso restrito')).toEqual({
      success: false,
      code: 'FORBIDDEN',
      status: 403,
      error: 'Acesso restrito',
    });

    expect(notFoundResponse('Registro ausente')).toEqual({
      success: false,
      code: 'NOT_FOUND',
      status: 404,
      error: 'Registro ausente',
    });

    expect(conflictResponse('Conflito de horário')).toEqual({
      success: false,
      code: 'SLOT_CONFLICT',
      status: 409,
      error: 'Conflito de horário',
    });

    expect(validationResponse('Erro no formulário', { name: 'Muito curto' })).toEqual({
      success: false,
      code: 'VALIDATION_ERROR',
      status: 422,
      error: 'Erro no formulário',
      fields: { name: 'Muito curto' },
    });

    expect(internalErrorResponse()).toEqual({
      success: false,
      code: 'INTERNAL_ERROR',
      status: 500,
      error: 'Ocorreu um erro inesperado no servidor.',
    });
  });

  it('toStructuredError translates AppError and unknown exceptions accurately', () => {
    const appErr = new ForbiddenError('Não autorizado.');
    expect(toStructuredError(appErr)).toEqual({
      success: false,
      code: 'FORBIDDEN',
      status: 403,
      error: 'Não autorizado.',
    });

    const conflictEx = new Error('Este horário já foi reservado.');
    const conflictRes = toStructuredError(conflictEx);
    expect(conflictRes.status).toBe(409);
    expect(conflictRes.code).toBe('SLOT_CONFLICT');

    const notFoundEx = new Error('Registro não encontrado.');
    const notFoundRes = toStructuredError(notFoundEx);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.code).toBe('NOT_FOUND');

    const genericEx = new Error('Falha de conexão com banco');
    const genericRes = toStructuredError(genericEx, 'Erro padrão.');
    expect(genericRes.status).toBe(500);
    expect(genericRes.code).toBe('INTERNAL_ERROR');
    expect(genericRes.error).toBe('Falha de conexão com banco');
  });
});
