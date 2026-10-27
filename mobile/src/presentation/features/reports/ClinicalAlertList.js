import { StyleSheet, Text, View } from 'react-native';

import { ALERT_SEVERITY_LABELS, labelFor } from '../../labels.js';

const ALERT_CONTENT = Object.freeze({
  LOW_ADHERENCE: Object.freeze({
    label: 'BAIXA ADESÃO',
    reason:
      'A adesão registrada está abaixo de 80% para as confirmações finais de doses. Este é um indicador informativo do protótipo, não um diagnóstico.',
  }),
  SEIZURE_FREQUENCY: Object.freeze({
    label: 'FREQUÊNCIA DE CRISES',
    reason:
      'Foram registradas pelo menos 3 crises no período selecionado. Este é um indicador informativo do protótipo, não um diagnóstico.',
  }),
});

function presentationFor(alert) {
  const content = ALERT_CONTENT[alert.id];

  return {
    label: content?.label ?? alert.id.replaceAll('_', ' '),
    reason: content?.reason ?? alert.reason,
    severity: labelFor(ALERT_SEVERITY_LABELS, alert.severity, alert.severity),
  };
}

export function ClinicalAlertList({ alerts }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Alertas informativos
      </Text>
      {alerts.length === 0 ? (
        <Text style={styles.empty}>
          Nenhuma regra de alerta do protótipo foi acionada neste período.
        </Text>
      ) : (
        <View
          accessibilityLabel="Alertas clínicos informativos"
          accessibilityRole="list"
          style={styles.list}
        >
          {alerts.map((alert) => {
            const presentation = presentationFor(alert);

            return (
              <View
                accessibilityLabel={`Alerta de gravidade ${presentation.severity}. ${presentation.reason}`}
                accessibilityRole="text"
                key={alert.id}
                style={styles.alert}
              >
                <Text style={styles.severity}>
                  [{presentation.severity}] {presentation.label}
                </Text>
                <Text style={styles.reason}>{presentation.reason}</Text>
                <Text style={styles.version}>Regra {alert.ruleVersion}</Text>
              </View>
            );
          })}
        </View>
      )}
      <Text style={styles.disclaimer}>
        Estes indicadores do protótipo são apenas informativos. Não são diagnósticos, orientações de
        emergência ou substitutos do julgamento clínico.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { color: '#17324D', fontSize: 20, fontWeight: '700' },
  list: { gap: 10 },
  alert: {
    backgroundColor: '#FFF7ED',
    borderLeftColor: '#C2410C',
    borderLeftWidth: 4,
    borderRadius: 8,
    gap: 6,
    padding: 14,
  },
  severity: { color: '#7C2D12', fontSize: 15, fontWeight: '800' },
  reason: { color: '#334155', fontSize: 15, lineHeight: 21 },
  version: { color: '#475467', fontSize: 13 },
  empty: { color: '#475467', fontSize: 15 },
  disclaimer: { color: '#334155', fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
