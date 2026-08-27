import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { ApiError } from '../middleware/errorHandler.js';

function parseId(value, field) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || String(id) !== String(value)) {
    throw new ApiError({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: `${field} must be a positive integer.`,
    });
  }
  return id;
}

function requireService(service) {
  const methods = ['listGrants', 'createGrant', 'revokeGrant', 'hasAccess'];
  if (methods.some((method) => typeof service?.[method] !== 'function')) {
    throw new TypeError('Access-grant routes require a complete service.');
  }
  return service;
}

export function createAccessGrantRoutes({ authService, accessGrantService }) {
  const service = requireService(accessGrantService);
  const router = Router();
  router.use(authenticate({ authService }));

  router.get('/patients/:patientId/grants', (request, response, next) => {
    try {
      const grants = service.listGrants({
        patientId: parseId(request.params.patientId, 'patientId'),
        actor: request.auth,
      });
      response.status(200).json(grants);
    } catch (error) {
      next(error);
    }
  });

  router.post('/patients/:patientId/grants', (request, response, next) => {
    try {
      const grant = service.createGrant({
        patientId: parseId(request.params.patientId, 'patientId'),
        medicCaretakerId: parseId(request.body?.medicCaretakerId, 'medicCaretakerId'),
        actor: request.auth,
      });
      response.status(201).json(grant);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/patients/:patientId/grants/:grantId', (request, response, next) => {
    try {
      const grant = service.revokeGrant({
        patientId: parseId(request.params.patientId, 'patientId'),
        grantId: parseId(request.params.grantId, 'grantId'),
        actor: request.auth,
      });
      response.status(200).json(grant);
    } catch (error) {
      next(error);
    }
  });

  router.get('/patients/:patientId/access', (request, response, next) => {
    try {
      const result = service.hasAccess({
        patientId: parseId(request.params.patientId, 'patientId'),
        actor: request.auth,
      });
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
