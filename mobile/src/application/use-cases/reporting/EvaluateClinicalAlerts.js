import { evaluateClinicalAlerts } from '../../../domain/rules/reportingRules.js';

export class EvaluateClinicalAlerts {
  execute(input) {
    return evaluateClinicalAlerts(input);
  }
}
