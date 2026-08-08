import {
  AuthenticationPort,
  ClinicalRecordRepositoryPort,
  NotificationPort,
  ReportExportPort,
  SessionStorePort,
} from '../../../src/application/ports/index.js';

function adapterWith(methods) {
  return Object.fromEntries(methods.map((method) => [method, jest.fn()]));
}

describe('application ports', () => {
  test.each([
    AuthenticationPort,
    ClinicalRecordRepositoryPort,
    NotificationPort,
    ReportExportPort,
    SessionStorePort,
  ])('$name accepts an adapter that implements its complete contract', (port) => {
    const adapter = adapterWith(port.methods);

    expect(port.assert(adapter)).toBe(adapter);
  });

  test('reports every missing adapter method', () => {
    expect(() => NotificationPort.assert({ requestPermission: jest.fn() })).toThrow(
      /getPermissionStatus, scheduleMedicationReminder, cancelScheduledReminder/,
    );
  });

  test('accepts class instances without requiring port inheritance', () => {
    class ExportAdapter {
      exportJsonFile() {
        return Promise.resolve('report.json');
      }
    }

    expect(ReportExportPort.assert(new ExportAdapter())).toBeInstanceOf(ExportAdapter);
  });

  test('keeps port contracts immutable', () => {
    expect(Object.isFrozen(AuthenticationPort)).toBe(true);
    expect(Object.isFrozen(AuthenticationPort.methods)).toBe(true);
  });
});
