import { ApiError } from './errorHandler.js';

function unauthenticatedError() {
  return new ApiError({
    status: 401,
    code: 'UNAUTHENTICATED',
    message: 'Authentication is required.',
  });
}

export function authenticate({ authService }) {
  if (typeof authService?.verifyToken !== 'function') {
    throw new TypeError('Authentication middleware requires an AuthService.');
  }

  return function authenticateRequest(request, _response, next) {
    const authorization = request.get('authorization');
    const match =
      typeof authorization === 'string' ? /^Bearer\s+(\S+)$/i.exec(authorization) : null;
    const user = match ? authService.verifyToken(match[1]) : null;

    if (!user) {
      next(unauthenticatedError());
      return;
    }

    request.auth = user;
    next();
  };
}

export function requireRole(...allowedRoles) {
  if (allowedRoles.length === 0 || allowedRoles.some((role) => typeof role !== 'string')) {
    throw new TypeError('Role middleware requires at least one role.');
  }

  const allowed = new Set(allowedRoles);

  return function authorizeRole(request, _response, next) {
    if (!request.auth) {
      next(unauthenticatedError());
      return;
    }

    if (!allowed.has(request.auth.role)) {
      next(
        new ApiError({
          status: 403,
          code: 'FORBIDDEN',
          message: 'Access is not permitted.',
        }),
      );
      return;
    }

    next();
  };
}
