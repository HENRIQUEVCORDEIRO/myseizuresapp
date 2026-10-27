export const OCCURRENCE_TYPE_LABELS = Object.freeze({
  FOCAL: 'Focal',
  GENERALIZED: 'Generalizada',
  UNKNOWN: 'Desconhecida',
  OTHER: 'Outra',
});

export const TRIGGER_CAUSE_LABELS = Object.freeze({
  ALCOHOL: 'Álcool',
  ILLNESS: 'Doença',
  MEDICATION: 'Medicação',
  OTHER: 'Outro',
  ROUTINE: 'Mudança de rotina',
  SLEEP: 'Sono',
  STRESS: 'Estresse',
});

export const TREATMENT_TYPE_LABELS = Object.freeze({
  MEDICATION: 'Medicamento',
  OTHER: 'Outro',
  THERAPY: 'Terapia',
});

export const ALERT_SEVERITY_LABELS = Object.freeze({
  HIGH: 'Alta',
  LOW: 'Baixa',
  MEDIUM: 'Média',
});

export const CONSUMPTION_STATUS_LABELS = Object.freeze({
  MISSED: 'Não tomada',
  TAKEN: 'Tomada',
});

export function labelFor(labels, value, fallback = 'Não registrado') {
  return labels[value] ?? fallback;
}
