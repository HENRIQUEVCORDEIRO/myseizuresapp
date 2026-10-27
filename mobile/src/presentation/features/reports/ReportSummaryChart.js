import { StyleSheet, Text, View } from 'react-native';

function barWidth(value, maximum) {
  if (maximum === 0) return '0%';
  return `${Math.max(6, Math.round((value / maximum) * 100))}%`;
}

export function ReportSummaryChart({ report }) {
  const values = [
    { label: 'Crises', value: report.seizures.length },
    { label: 'Possíveis gatilhos', value: report.triggers.length },
    { label: 'Doses finais', value: report.adherence.finalDoses },
  ];
  const maximum = Math.max(...values.map((item) => item.value));

  return (
    <View
      accessibilityLabel={`Gráfico do período: ${values.map((item) => `${item.label} ${item.value}`).join(', ')}`}
      accessibilityRole="image"
      style={styles.chart}
    >
      <Text accessibilityRole="header" style={styles.title}>
        Gráfico do período
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
        As barras são acompanhadas dos valores exatos e não dependem apenas da cor.
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
