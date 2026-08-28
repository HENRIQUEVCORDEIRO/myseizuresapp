jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { document: 'file:///docs' } }));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import { ReportFileExporter } from '../../../src/infrastructure/export/ReportFileExporter.js';

function document() {
  return {
    formatVersion: '1.0',
    generatedAt: '2026-08-27T12:00:00.000Z',
    reportPeriod: { start: '2026-08-21T00:00:00.000Z', end: '2026-08-27T23:59:59.999Z' },
    patient: { id: 1, birthDate: '1980-01-01' },
    seizures: [],
    triggers: [],
    adherence: { finalDoses: 0, takenDoses: 0 },
    alerts: [],
  };
}

function harness({ sharingAvailable = true } = {}) {
  const files = [];
  class FakeFile {
    constructor(directory, fileName) {
      this.directory = directory;
      this.fileName = fileName;
      this.uri = `${directory}/${fileName}`;
      this.create = jest.fn();
      this.write = jest.fn();
      files.push(this);
    }
  }
  const sharing = {
    isAvailableAsync: jest.fn().mockResolvedValue(sharingAvailable),
    shareAsync: jest.fn().mockResolvedValue(undefined),
  };
  return {
    exporter: new ReportFileExporter({
      FileAdapter: FakeFile,
      directory: 'file:///documents',
      sharing,
    }),
    files,
    sharing,
  };
}

describe('ReportFileExporter', () => {
  test('writes a formatted JSON file locally and opens the native share sheet', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn();
    try {
      const { exporter, files, sharing } = harness();
      const data = document();
      const result = await exporter.exportJsonFile({ data });

      expect(files).toHaveLength(1);
      expect(files[0].create).toHaveBeenCalledWith({ intermediates: true, overwrite: true });
      expect(files[0].write).toHaveBeenCalledWith(JSON.stringify(data, null, 2), {
        encoding: 'utf8',
      });
      expect(sharing.shareAsync).toHaveBeenCalledWith(result.uri, {
        dialogTitle: 'Share epilepsy care report',
        mimeType: 'application/json',
        UTI: 'public.json',
      });
      expect(result).toEqual({
        fileName: 'myseizures-report-patient-1-2026-08-27.json',
        shared: true,
        uri: 'file:///documents/myseizures-report-patient-1-2026-08-27.json',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('retains the local file when native sharing is unavailable', async () => {
    const { exporter, files, sharing } = harness({ sharingAvailable: false });
    const result = await exporter.exportJsonFile({ data: document() });

    expect(files[0].write).toHaveBeenCalledTimes(1);
    expect(sharing.shareAsync).not.toHaveBeenCalled();
    expect(result.shared).toBe(false);
    expect(result.uri).toMatch(/^file:\/\/\/documents\//);
  });

  test('rejects invalid documents and unsafe file names before writing', async () => {
    const { exporter, files } = harness();
    await expect(exporter.exportJsonFile({ data: { formatVersion: '2.0' } })).rejects.toThrow(
      /formatVersion 1\.0/,
    );
    await expect(
      exporter.exportJsonFile({ data: document(), fileName: '../private.json' }),
    ).rejects.toThrow(/unsafe/);
    expect(files).toHaveLength(0);
  });
});
