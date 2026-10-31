import {
  calendarDateToDate,
  dateToCalendarDate,
  dateToTimeValue,
  formatCalendarDate,
  formatDate,
  formatDateLong,
  formatDateTime,
  formatDateTimeLong,
  formatTime,
  formatTimeList,
  timeValueToDate,
} from '../../../src/presentation/formatters/index.js';

describe('presentation date and time formatting', () => {
  const value = new Date(2026, 9, 25, 14, 5, 0, 0);

  test('uses Brazilian day/month/year and 24-hour local time everywhere', () => {
    expect(formatDate(value)).toBe('25/10/2026');
    expect(formatTime(value)).toBe('14:05');
    expect(formatDateTime(value)).toBe('25/10/2026 14:05');
    expect(formatDateLong(value)).toBe('25 de outubro de 2026');
    expect(formatDateTimeLong(value)).toBe('25 de outubro de 2026 às 14:05');
  });

  test('handles missing and invalid values without inventing a timestamp', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');
    expect(formatDateTimeLong('not-a-date')).toBe('—');
  });

  test('converts native picker values to and from local 24-hour times', () => {
    const date = timeValueToDate('08:30', value);

    expect(date.getHours()).toBe(8);
    expect(date.getMinutes()).toBe(30);
    expect(dateToTimeValue(date)).toBe('08:30');
    expect(formatTimeList(['08:00', '20:00'])).toBe('08:00, 20:00');
    expect(formatTimeList([])).toBe('—');
  });

  test('keeps calendar dates on the same local day', () => {
    expect(formatCalendarDate('2026-10-25')).toBe('25/10/2026');
    expect(formatCalendarDate('')).toBe('—');

    const date = calendarDateToDate('2026-10-25');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(25);
    expect(dateToCalendarDate(date)).toBe('2026-10-25');
  });
});
