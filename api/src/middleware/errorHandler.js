const MALFORMED_BODY_TYPES = new Set(['entity.parse.failed', 'entity.too.large']);

export class ApiError extends Error {
  constructor({ status, code, message }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function isMalformedBody(error) {
  return (
    MALFORMED_BODY_TYPES.has(error?.type) ||
    (error instanceof SyntaxError && error?.status === 400 && 'body' in error)
  );
}

function normalizeError(error) {
  if (isMalformedBody(error)) {
    return {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Request body must contain valid JSON.',
    };
  }

  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
    };
  }

  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  };
}

export function notFoundHandler(_request, _response, next) {
  next(
    new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    }),
  );
}

export function errorHandler(error, _request, response, _next) {
  const normalized = normalizeError(error);

  response.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
    },
  });
}
