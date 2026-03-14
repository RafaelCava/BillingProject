import { applyDecorators } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { FORBIDDEN_EXAMPLE, SUCCESS_EXAMPLE, UNAUTHORIZED_EXAMPLE, VALIDATION_ERROR_EXAMPLE } from './swagger.examples';

export function ApiCookieAccessAuth() {
  return applyDecorators(ApiCookieAuth('access_token'));
}

export function ApiSuccessResponse(status: number, description: string, example: unknown) {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      content: {
        'application/json': {
          example,
        },
      },
    }),
  );
}

export function ApiErrorResponse(status: number, description: string, example: unknown) {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      content: {
        'application/json': {
          example,
        },
      },
    }),
  );
}

export function ApiUnauthorizedResponse(description = 'Token ausente ou invalido.') {
  return ApiErrorResponse(401, description, UNAUTHORIZED_EXAMPLE);
}

export function ApiForbiddenResponse(description = 'Perfil sem permissao.') {
  return ApiErrorResponse(403, description, FORBIDDEN_EXAMPLE);
}

export function ApiValidationErrorResponse(description = 'Payload invalido.', example?: unknown) {
  return ApiErrorResponse(400, description, example ?? VALIDATION_ERROR_EXAMPLE);
}

export function ApiSimpleSuccessResponse(description = 'Operacao realizada com sucesso.') {
  return ApiSuccessResponse(200, description, SUCCESS_EXAMPLE);
}