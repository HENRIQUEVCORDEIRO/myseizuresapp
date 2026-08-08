import { requireInteger } from './validation.js';

export class DailyFrequency {
  constructor(value) {
    this.value = requireInteger(value, 'dailyFrequency', { min: 1 });
    Object.freeze(this);
  }

  valueOf() {
    return this.value;
  }

  toString() {
    return String(this.value);
  }
}
