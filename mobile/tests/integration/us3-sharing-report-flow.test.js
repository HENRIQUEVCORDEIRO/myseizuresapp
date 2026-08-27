import { AccessGrantRepository } from '../../../api/src/repositories/AccessGrantRepository.js';
import { AccessGrantService } from '../../../api/src/services/AccessGrantService.js';
import {
  AuthorizePatientAccess,
  GrantAccess,
  ListAccessGrants,
  RevokeAccess,
} from '../../src/application/use-cases/access/index.js';
import {
  GenerateReport,
  ReportAccessDeniedError,
} from '../../src/application/use-cases/reporting/index.js';
import { ConsumptionStatus } from '../../src/domain/value-objects/index.js';
import { AccessGrantClient } from '../../src/infrastructure/api/AccessGrantClient.js';
import { RestClientError } from '../../src/infrastructure/api/RestClient.js';

const PATIENT_ID = 1;
const PROFESSIONAL_ID = 1;
const PATIENT_TOKEN = 'patient-session';
const PROFESSIONAL_TOKEN = 'professional-session';
const PERIOD_END = '2026-08-26T23:59:59.999Z';

function createLocalAccessAdapter(service) {
  const actors = {
    [PATIENT_TOKEN]: { id: 1, patientId: PATIENT_ID, role: 'PATIENT' },
    [PROFESSIONAL_TOKEN]: {
      id: 2,
      medicCaretakerId: PROFESSIONAL_ID,
      role: 'MEDIC_CARETAKER',
    },
  };

  return {
    async request(path, { method = 'GET', token, body } = {}) {
      const actor = actors[token];
      const grantPath = path.match(/^\/patients\/(\d+)\/grants$/);
      const revokePath = path.match(/^\/patients\/(\d+)\/grants\/(\d+)$/);
      const accessPath = path.match(/^\/patients\/(\d+)\/access$/);

      try {
        if (grantPath && method === 'GET') {
          return service.listGrants({ patientId: Number(grantPath[1]), actor });
        }
        if (grantPath && method === 'POST') {
          return service.createGrant({
            patientId: Number(grantPath[1]),
            medicCaretakerId: body?.medicCaretakerId,
            actor,
          });
        }
        if (revokePath && method === 'DELETE') {
          return service.revokeGrant({
            patientId: Number(revokePath[1]),
            grantId: Number(revokePath[2]),
            actor,
          });
        }
        if (accessPath && method === 'GET') {
          return service.hasAccess({ patientId: Number(accessPath[1]), actor });
        }
        throw new RestClientError({ status: 404, code: 'NOT_FOUND', message: 'Not found.' });
      } catch (error) {
        if (error?.code && Number.isInteger(error?.status)) {
          throw new RestClientError({
            status: error.status,
            code: error.code,
            message: error.message,
          });
        }
        throw error;
      }
    },
  };
}

test('grant, report, and revoke journey denies every subsequent clinical report query', async () => {
  const accessService = new AccessGrantService({
    repository: new AccessGrantRepository({ medicCaretakerIds: [PROFESSIONAL_ID] }),
    now: (() => {
      const values = ['2026-08-26T10:00:00.000Z', '2026-08-26T11:00:00.000Z'];
      return () => values.shift();
    })(),
  });
  const accessGrantClient = new AccessGrantClient({
    restClient: createLocalAccessAdapter(accessService),
  });
  const patientOptions = {
    accessGrantClient,
    getActivePatientId: () => PATIENT_ID,
    getSessionToken: async () => PATIENT_TOKEN,
  };
  const authorizePatientAccess = new AuthorizePatientAccess({
    accessGrantClient,
    getSessionToken: async () => PROFESSIONAL_TOKEN,
  });
  const listAccessGrants = new ListAccessGrants(patientOptions);
  const grantAccess = new GrantAccess(patientOptions);
  const revokeAccess = new RevokeAccess(patientOptions);
  const clinicalRepositories = {
    seizureRepository: {
      listSeizuresByPeriod: jest.fn().mockResolvedValue([
        { id: 1, occurredAt: '2026-08-21T08:00:00.000Z' },
        { id: 2, occurredAt: '2026-08-22T08:00:00.000Z' },
        { id: 3, occurredAt: '2026-08-23T08:00:00.000Z' },
      ]),
    },
    triggerRepository: {
      listTriggersByPeriod: jest
        .fn()
        .mockResolvedValue([
          { id: 1, commonCause: 'SLEEP', recordedAt: '2026-08-21T07:00:00.000Z' },
        ]),
    },
    treatmentRepository: {
      listAdherenceByPeriod: jest.fn().mockResolvedValue([
        { reminderId: 1, consumptionStatus: ConsumptionStatus.TAKEN },
        { reminderId: 2, consumptionStatus: ConsumptionStatus.MISSED },
      ]),
    },
  };
  const generateReport = new GenerateReport({
    ...clinicalRepositories,
    authorizePatientAccess,
  });

  const created = await grantAccess.execute({ medicCaretakerId: PROFESSIONAL_ID });
  expect(created.ok).toBe(true);
  await expect(listAccessGrants.execute()).resolves.toEqual({ ok: true, value: [created.value] });
  await expect(authorizePatientAccess.execute({ patientId: PATIENT_ID })).resolves.toEqual({
    ok: true,
    value: { allowed: true },
  });

  const authorizedReport = await generateReport.execute({
    patientId: PATIENT_ID,
    periodType: 'WEEKLY',
    periodEnd: PERIOD_END,
  });
  expect(authorizedReport.seizures).toHaveLength(3);
  expect(authorizedReport.triggerTrends).toEqual([{ cause: 'SLEEP', count: 1 }]);
  expect(authorizedReport.alerts.map((alert) => alert.id)).toEqual([
    'SEIZURE_FREQUENCY',
    'LOW_ADHERENCE',
  ]);

  const revoked = await revokeAccess.execute({ grantId: created.value.id });
  expect(revoked).toEqual({
    ok: true,
    value: { ...created.value, revokedAt: '2026-08-26T11:00:00.000Z' },
  });
  await expect(authorizePatientAccess.execute({ patientId: PATIENT_ID })).resolves.toEqual({
    ok: true,
    value: { allowed: false },
  });

  const queriesBeforeDeniedAttempt = Object.values(clinicalRepositories).map(
    (repository) => Object.values(repository)[0].mock.calls.length,
  );
  await expect(
    generateReport.execute({
      patientId: PATIENT_ID,
      periodType: 'WEEKLY',
      periodEnd: PERIOD_END,
    }),
  ).rejects.toBeInstanceOf(ReportAccessDeniedError);
  expect(
    Object.values(clinicalRepositories).map(
      (repository) => Object.values(repository)[0].mock.calls.length,
    ),
  ).toEqual(queriesBeforeDeniedAttempt);
});
