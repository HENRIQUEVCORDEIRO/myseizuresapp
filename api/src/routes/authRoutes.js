import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { ApiError } from '../middleware/errorHandler.js';

function validationError() {
  return new ApiError({
    status: 422,
    code: 'VALIDATION_ERROR',
    message: 'Email and password are required.',
  });
}

export function createAuthRoutes({ authService }) {
  if (typeof authService?.signIn !== 'function' || typeof authService?.verifyToken !== 'function') {
    throw new TypeError('Authentication routes require an AuthService.');
  }

  const router = Router();

  router.post('/auth/login', (request, response, next) => {
    const { email, password } = request.body ?? {};

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      next(validationError());
      return;
    }

    const result = authService.signIn(email, password);

    if (!result) {
      next(
        new ApiError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'Email or password is invalid.',
        }),
      );
      return;
    }

    response.status(200).json(result);
  });

  router.get('/users/me', authenticate({ authService }), (request, response) => {
    const { id, name, role } = request.auth;
    response.status(200).json({ id, name, role });
  });

  return router;
}
