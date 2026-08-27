import { StyleSheet, Text, View } from 'react-native';

function barWidth(value, maximum) {
  if (maximum === 0) return '0%';
  return `${Math.max(6, Math.round((value / maximum) * 100))}%`;
}

export function ReportSummaryChart({ report }) {
  const values = [
    { label: 'Seizures', value: report.seizures.length },
    { label: 'Possible triggers', value: report.triggers.length },
    { label: 'Final doses', value: report.adherence.finalDoses },
  ];
  const maximum = Math.max(...values.map((item) => item.value));

  return (
    <View
      accessibilityLabel={`Summary chart: ${values.map((item) => `${item.label} ${item.value}`).join(', ')}`}
      accessibilityRole="image"
      style={styles.chart}
    >
      <Text accessibilityRole="header" style={styles.title}>
        Period chart
      </Text>
      {values.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: barWidth(item.value, maximum) }]} />
          </View>
        </View>
      ))}
      <Text style={styles.note}>
        Bars are accompanied by exact values and do not rely on colour alone.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { backgroundColor: '#FFFFFF', borderRadius: 8, gap: 14, padding: 16 },
  title: { color: '#17324D', fontSize: 20, fontWeight: '700' },
  row: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#334155', fontSize: 15 },
  value: { color: '#17324D', fontSize: 15, fontWeight: '700' },
  track: { backgroundColor: '#E8EEF5', borderRadius: 6, height: 12, overflow: 'hidden' },
  bar: { backgroundColor: '#175CD3', borderRadius: 6, height: 12 },
  note: { color: '#475467', fontSize: 13, lineHeight: 18 },
});
