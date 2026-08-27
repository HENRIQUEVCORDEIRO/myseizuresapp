import {
  AuthorizePatientAccess,
  GrantAccess,
  ListAccessGrants,
  RevokeAccess,
} from '../../../src/application/use-cases/access/index.js';
import { AccessGrantClient } from '../../../src/infrastructure/api/AccessGrantClient.js';
import { RestClientError } from '../../../src/infrastructure/api/RestClient.js';

const TOKEN = 'test-session-token';

function createAdapter() {
  return {
    listAccessGrants: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    createAccessGrant: jest.fn().mockResolvedValue({ ok: true, value: { id: 1 } }),
    revokeAccessGrant: jest.fn().mockResolvedValue({ ok: true, value: { id: 1 } }),
    hasPatientAccess: jest.fn().mockResolvedValue({ ok: true, value: { allowed: true } }),
  };
}

describe('mobile access-grant application boundary', () => {
  test('patient commands scope list, grant, and revoke calls to the active patient and session', async () => {
    const accessGrantClient = createAdapter();
    const options = {
      accessGrantClient,
      getActivePatientId: () => 7,
      getSessionToken: () => TOKEN,
    };
    await new ListAccessGrants(options).execute();
    await new GrantAccess(options).execute({ medicCaretakerId: 3 });
    await new RevokeAccess(options).execute({ grantId: 9 });
    expect(accessGrantClient.listAccessGrants).toHaveBeenCalledWith(7, TOKEN);
    expect(accessGrantClient.createAccessGrant).toHaveBeenCalledWith(7, 3, TOKEN);
    expect(accessGrantClient.revokeAccessGrant).toHaveBeenCalledWith(7, 9, TOKEN);
  });

  test('authorization checks the selected patient using the current session', async () => {
    const accessGrantClient = createAdapter();
    const useCase = new AuthorizePatientAccess({
      accessGrantClient,
      getSessionToken: () => TOKEN,
    });
    await expect(useCase.execute({ patientId: 7 })).resolves.toEqual({
      ok: true,
      value: { allowed: true },
    });
    expect(accessGrantClient.hasPatientAccess).toHaveBeenCalledWith(7, TOKEN);
  });

  test('client maps contract and network errors to non-disclosing results', async () => {
    const restClient = {
      request: jest
        .fn()
        .mockRejectedValueOnce(
          new RestClientError({ status: 403, code: 'FORBIDDEN', message: 'private server detail' }),
        )
        .mockRejectedValueOnce(
          new RestClientError({ status: null, code: 'NETWORK_ERROR', message: 'socket detail' }),
        ),
    };
    const client = new AccessGrantClient({ restClient });
    await expect(client.hasPatientAccess(1, TOKEN)).resolves.toEqual({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Access is not permitted.', retryable: false },
    });
    await expect(client.listAccessGrants(1, TOKEN)).resolves.toEqual({
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'The sharing service is unavailable. Try again.',
        retryable: true,
      },
    });
  });
});
