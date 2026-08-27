import { StyleSheet, Text, View } from 'react-native';

export function ClinicalAlertList({ alerts }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Informational alerts
      </Text>
      {alerts.length === 0 ? (
        <Text style={styles.empty}>No prototype alert rule matched this selected period.</Text>
      ) : (
        <View
          accessibilityLabel="Clinical informational alerts"
          accessibilityRole="list"
          style={styles.list}
        >
          {alerts.map((alert) => (
            <View
              accessibilityLabel={`${alert.severity} severity alert. ${alert.reason}`}
              accessibilityRole="listitem"
              key={alert.id}
              style={styles.alert}
            >
              <Text style={styles.severity}>
                [{alert.severity}] {alert.id.replaceAll('_', ' ')}
              </Text>
              <Text style={styles.reason}>{alert.reason}</Text>
              <Text style={styles.version}>Rule {alert.ruleVersion}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.disclaimer}>
        These prototype indicators are informational only. They are not diagnoses, emergency
        guidance, or substitutes for clinical judgment.
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
