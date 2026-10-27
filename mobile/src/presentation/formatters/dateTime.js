const MONTHS = Object.freeze([
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]);

function asDate(value) {
  if (value instanceof Date) return value;
  if (value === null || value === undefined || value === '') return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatDate(value) {
  const date = asDate(value);
  if (!date) return '—';

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatTime(value) {
  const date = asDate(value);
  if (!date) return '—';

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(value) {
  const date = asDate(value);
  if (!date) return '—';

  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatDateTimeLong(value) {
  const date = asDate(value);
  if (!date) return '—';

  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()} às ${formatTime(date)}`;
}

export function formatDateLong(value) {
  const date = asDate(value);
  if (!date) return '—';

  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

export function timeValueToDate(value, baseDate = new Date()) {
  const [hours, minutes] = String(value ?? '')
    .split(':')
    .map(Number);
  const date = new Date(baseDate);
  date.setHours(
    Number.isInteger(hours) && hours >= 0 && hours <= 23 ? hours : 8,
    Number.isInteger(minutes) && minutes >= 0 && minutes <= 59 ? minutes : 0,
    0,
    0,
  );
  return date;
}

export function dateToTimeValue(value) {
  return formatTime(value);
}

export function formatTimeList(values) {
  return Array.isArray(values) && values.length ? values.join(', ') : '—';
}
