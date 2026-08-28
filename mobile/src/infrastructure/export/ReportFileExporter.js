import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ReportExportPort } from '../../application/ports/index.js';

const JSON_MIME_TYPE = 'application/json';
const JSON_UTI = 'public.json';

function requireDocument(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Report export requires a JSON document object.');
  }
  if (value.formatVersion !== '1.0') {
    throw new TypeError('Report export requires formatVersion 1.0.');
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    throw new TypeError('Report export document must be JSON serializable.', { cause: error });
  }
}

function safeFileName(value, document) {
  const fallbackDate = String(document.generatedAt ?? '').slice(0, 10) || 'report';
  const fallback = `myseizures-report-patient-${document.patient?.id ?? 'unknown'}-${fallbackDate}.json`;
  const candidate = value === undefined ? fallback : value;
  if (typeof candidate !== 'string' || !candidate.trim()) {
    throw new TypeError('Report export file name must be a non-empty string.');
  }
  const name = candidate.trim();
  if (name !== name.replace(/[\\/:*?"<>|]/g, '-') || name.includes('..')) {
    throw new TypeError('Report export file name contains unsafe characters.');
  }
  return name.toLowerCase().endsWith('.json') ? name : `${name}.json`;
}

function requireFileAdapter(FileAdapter) {
  if (typeof FileAdapter !== 'function') {
    throw new TypeError('Report file exporter requires a file adapter constructor.');
  }
  return FileAdapter;
}

function requireSharingAdapter(sharing) {
  if (
    typeof sharing?.isAvailableAsync !== 'function' ||
    typeof sharing?.shareAsync !== 'function'
  ) {
    throw new TypeError('Report file exporter requires a sharing adapter.');
  }
  return sharing;
}

export class ReportFileExporter {
  constructor({ FileAdapter, directory, sharing } = {}) {
    this.FileAdapter = FileAdapter ?? File;
    this.directory = directory ?? Paths?.document;
    this.sharing = sharing ?? Sharing;
    ReportExportPort.assert(this);
  }

  async exportJsonFile({ data, fileName, share = true } = {}) {
    if (typeof share !== 'boolean')
      throw new TypeError('Report export share flag must be boolean.');
    const FileConstructor = requireFileAdapter(this.FileAdapter);
    if (!this.directory) throw new TypeError('Report file exporter requires a local directory.');
    const sharing = requireSharingAdapter(this.sharing);
    const contents = requireDocument(data);
    const safeName = safeFileName(fileName, data);
    const file = new FileConstructor(this.directory, safeName);
    if (
      !file ||
      typeof file.create !== 'function' ||
      typeof file.write !== 'function' ||
      typeof file.uri !== 'string'
    ) {
      throw new TypeError('File adapter must provide create(), write(), and uri.');
    }

    file.create({ intermediates: true, overwrite: true });
    file.write(contents, { encoding: 'utf8' });

    let shared = false;
    if (share && (await sharing.isAvailableAsync())) {
      await sharing.shareAsync(file.uri, {
        dialogTitle: 'Share epilepsy care report',
        mimeType: JSON_MIME_TYPE,
        UTI: JSON_UTI,
      });
      shared = true;
    }

    return Object.freeze({ fileName: safeName, shared, uri: file.uri });
  }
}
