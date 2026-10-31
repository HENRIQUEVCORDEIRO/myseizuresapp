import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getContainer } from '../../../src/composition/container.js';
import { TreatmentType } from '../../../src/domain/value-objects/index.js';
import {
  Button,
  CalendarDateField,
  Card,
  ChoiceGroup,
  FormFeedback,
  FormField,
  Screen,
  TimeListField,
} from '../../../src/presentation/components/index.js';
import {
  calendarDateToDate,
  dateToCalendarDate,
  formatCalendarDate,
} from '../../../src/presentation/formatters/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';
import { colors, radius, spacing, typography } from '../../../src/presentation/theme/tokens.js';

const STEPS = Object.freeze([
  { key: 'info', label: 'Info' },
  { key: 'frequency', label: 'Frequência' },
  { key: 'period', label: 'Período' },
]);

const TREATMENT_TYPE_LABELS = Object.freeze({
  [TreatmentType.MEDICATION]: 'Medicamento',
  [TreatmentType.THERAPY]: 'Terapia',
  [TreatmentType.OTHER]: 'Outro',
});

const TYPES = Object.entries(TreatmentType).map(([, value]) => ({
  label: TREATMENT_TYPE_LABELS[value],
  value,
}));

const FREQUENCY_OPTIONS = Object.freeze(
  [1, 2, 3, 4].map((value) => ({ label: `${value}× ao dia`, value })),
);

const DEFAULT_TIMES = Object.freeze({
  1: Object.freeze(['08:00']),
  2: Object.freeze(['08:00', '20:00']),
  3: Object.freeze(['08:00', '12:00', '20:00']),
  4: Object.freeze(['08:00', '12:00', '18:00', '22:00']),
});

const TIME_SHORTCUTS = Object.freeze([
  { label: 'Manhã 08:00', value: '08:00' },
  { label: 'Almoço 12:00', value: '12:00' },
  { label: 'Noite 20:00', value: '20:00' },
]);

const START_OPTIONS = Object.freeze([
  { label: 'Hoje', value: 'today' },
  { label: 'Outra data', value: 'custom' },
]);

const END_OPTIONS = Object.freeze([
  { label: 'Sem data de término', value: 'none' },
  { label: 'Definir data', value: 'custom' },
]);

function normalizedTimes(values) {
  return [...new Set(values)].sort();
}

function todayCalendarDate() {
  return dateToCalendarDate(new Date());
}

function initialFrequency(initialTreatment) {
  const value = initialTreatment?.dailyFrequency;
  if (typeof value === 'number') return value;
  if (value && typeof value.value === 'number') return value.value;
  return initialTreatment?.baseTimes?.length || 1;
}

function resizeTimes(times, count) {
  const next = normalizedTimes(times).slice(0, count);
  const defaults = DEFAULT_TIMES[count] ?? DEFAULT_TIMES[4];

  for (const time of defaults) {
    if (next.length >= count) break;
    if (!next.includes(time)) next.push(time);
  }

  return next.sort();
}

function Stepper({ current }) {
  return (
    <View
      accessibilityLabel={`Etapa ${current + 1} de ${STEPS.length}: ${STEPS[current].label}`}
      accessible
      style={styles.stepper}
    >
      {STEPS.map((step, index) => {
        const active = index <= current;

        return (
          <View key={step.key} style={styles.step}>
            <View style={[styles.stepDot, active ? styles.stepDotActive : null]}>
              <Text style={[styles.stepNumber, active ? styles.stepNumberActive : null]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, index === current ? styles.stepLabelActive : null]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function TreatmentForm({ manageTreatment, initialTreatment = null }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialTreatment?.name ?? '');
  const [reason, setReason] = useState(initialTreatment?.reason ?? '');
  const [type, setType] = useState(initialTreatment?.type ?? TreatmentType.MEDICATION);
  const [dailyFrequency, setDailyFrequency] = useState(initialFrequency(initialTreatment));
  const [times, setTimes] = useState(initialTreatment?.baseTimes ?? []);
  const [doseAmount, setDoseAmount] = useState(initialTreatment?.doseAmount ?? '');
  const [startMode, setStartMode] = useState(initialTreatment?.startDate ? 'custom' : 'today');
  const [startDate, setStartDate] = useState(initialTreatment?.startDate ?? todayCalendarDate());
  const [endMode, setEndMode] = useState(initialTreatment?.endDate ? 'custom' : 'none');
  const [endDate, setEndDate] = useState(initialTreatment?.endDate ?? '');
  const [feedback, setFeedback] = useState(null);
  const [timeError, setTimeError] = useState(null);
  const [dateError, setDateError] = useState(null);
  const [busy, setBusy] = useState(false);

  function goNext() {
    setFeedback(null);

    if (step === 0 && !name.trim()) {
      setFeedback({ variant: 'error', message: 'Informe o nome do tratamento.' });
      return;
    }

    if (step === 1 && times.length === 0) {
      setTimeError('Informe pelo menos um horário diário.');
      return;
    }

    setTimeError(null);
    setDateError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setFeedback(null);
    setTimeError(null);
    setDateError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleFrequencyChange(value) {
    setDailyFrequency(value);
    setTimes((current) => resizeTimes(current, value));
    setTimeError(null);
  }

  function handleTimesChange(values) {
    const next = normalizedTimes(values);
    setTimes(next);
    setDailyFrequency(next.length || 1);
    setTimeError(null);
  }

  function applyTimeShortcut(value) {
    const next = normalizedTimes(times);
    if (next.includes(value) || next.length >= 4) return;

    next.push(value);
    const sorted = normalizedTimes(next);
    setTimes(sorted);
    setDailyFrequency(sorted.length);
    setTimeError(null);
  }

  function handleStartModeChange(value) {
    setStartMode(value);
    setDateError(null);
    if (value === 'today') {
      setStartDate(todayCalendarDate());
    }
  }

  function handleEndModeChange(value) {
    setEndMode(value);
    setDateError(null);
    if (value === 'none') {
      setEndDate('');
    } else if (!endDate) {
      setEndDate(startDate || todayCalendarDate());
    }
  }

  async function submit() {
    const baseTimes = normalizedTimes(times);

    if (!name.trim()) {
      setStep(0);
      setFeedback({ variant: 'error', message: 'Informe o nome do tratamento.' });
      return;
    }

    if (baseTimes.length === 0) {
      setStep(1);
      setTimeError('Informe pelo menos um horário diário.');
      return;
    }

    const resolvedStartDate = startMode === 'today' ? todayCalendarDate() : startDate;
    const resolvedEndDate = endMode === 'custom' ? endDate : null;

    if (!resolvedStartDate) {
      setDateError('Escolha a data de início.');
      return;
    }

    if (endMode === 'custom' && !resolvedEndDate) {
      setDateError('Escolha a data de término.');
      return;
    }

    if (resolvedEndDate && resolvedEndDate < resolvedStartDate) {
      setDateError('A data de término não pode ser anterior à data de início.');
      return;
    }

    setDateError(null);
    setFeedback(null);
    setBusy(true);
    try {
      const result = await manageTreatment.execute({
        id: initialTreatment?.id,
        type,
        name: name.trim(),
        reason: reason.trim() || null,
        dailyFrequency: baseTimes.length,
        baseTimes,
        doseAmount: doseAmount.trim() || null,
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        active: initialTreatment?.active ?? true,
      });
      setFeedback({
        variant: 'success',
        message: result.delivery.inApp.length
          ? 'Tratamento salvo. Os lembretes estão disponíveis no aplicativo.'
          : 'Tratamento e notificações salvos.',
      });
    } catch {
      setFeedback({
        variant: 'error',
        message: 'Não foi possível salvar o tratamento. Verifique os dados e tente novamente.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      subtitle={`Etapa ${step + 1} de ${STEPS.length} — ${STEPS[step].label}`}
      title={initialTreatment ? 'Editar tratamento' : 'Novo tratamento'}
    >
      <Stepper current={step} />

      {step === 0 ? (
        <>
          <FormField label="Nome do tratamento" value={name} onChangeText={setName} />
          <FormField
            label="Motivo do tratamento (opcional)"
            placeholder="Ex.: Epilepsia"
            value={reason}
            onChangeText={setReason}
          />
          <ChoiceGroup
            label="Tipo de tratamento"
            onValueChange={setType}
            options={TYPES}
            required
            value={type}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <ChoiceGroup
            label="Quantas vezes ao dia?"
            onValueChange={handleFrequencyChange}
            options={FREQUENCY_OPTIONS}
            required
            value={dailyFrequency}
          />
          <View style={styles.shortcutBlock}>
            <Text style={styles.shortcutLabel}>Atalhos de horário</Text>
            <View style={styles.shortcutRow}>
              {TIME_SHORTCUTS.map((shortcut) => {
                const selected = times.includes(shortcut.value);

                return (
                  <Button
                    accessibilityLabel={shortcut.label}
                    key={shortcut.value}
                    onPress={() => applyTimeShortcut(shortcut.value)}
                    size="compact"
                    title={shortcut.label}
                    variant={selected ? 'primary' : 'secondary'}
                  />
                );
              })}
            </View>
          </View>
          <TimeListField
            accessibilityHint="Escolha os horários diários do tratamento no formato de 24 horas"
            error={timeError}
            label="Horários diários"
            onChange={handleTimesChange}
            required
            value={times}
          />
          <FormField
            label="Quanto por dose? (opcional)"
            placeholder="Ex.: 500 mg"
            value={doseAmount}
            onChangeText={setDoseAmount}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <ChoiceGroup
            label="Começou quando?"
            onValueChange={handleStartModeChange}
            options={START_OPTIONS}
            required
            value={startMode}
          />
          {startMode === 'custom' ? (
            <CalendarDateField
              label="Data de início"
              maximumDate={new Date()}
              onValueChange={setStartDate}
              required
              testID="treatment-start-date-picker"
              value={startDate}
            />
          ) : null}
          <ChoiceGroup
            label="Termina quando?"
            onValueChange={handleEndModeChange}
            options={END_OPTIONS}
            required
            value={endMode}
          />
          {endMode === 'custom' ? (
            <CalendarDateField
              label="Data de término"
              minimumDate={calendarDateToDate(startDate)}
              onValueChange={setEndDate}
              required
              testID="treatment-end-date-picker"
              value={endDate}
            />
          ) : null}
          <FormFeedback message={dateError} variant="error" />
          <Card title="Resumo">
            <Text style={styles.summaryName}>{name.trim() || 'Sem nome'}</Text>
            <Text style={styles.summaryDetail}>
              {TREATMENT_TYPE_LABELS[type]}
              {reason.trim() ? ` · ${reason.trim()}` : ''}
            </Text>
            <Text style={styles.summaryDetail}>
              {times.length}× ao dia · {times.length ? times.join(' · ') : 'Sem horários'}
            </Text>
            {doseAmount.trim() ? (
              <Text style={styles.summaryDetail}>Dose: {doseAmount.trim()}</Text>
            ) : null}
            <Text style={styles.summaryDetail}>
              Início: {startMode === 'today' ? 'Hoje' : formatCalendarDate(startDate)}
            </Text>
            <Text style={styles.summaryDetail}>
              Término: {endMode === 'none' ? 'Sem data de término' : formatCalendarDate(endDate)}
            </Text>
          </Card>
        </>
      ) : null}

      <FormFeedback {...feedback} />
      <View style={styles.navigation}>
        {step > 0 ? <Button onPress={goBack} title="Anterior" variant="secondary" /> : null}
        {step < STEPS.length - 1 ? (
          <Button onPress={goNext} title="Próximo" />
        ) : (
          <Button busy={busy} onPress={submit} title="Salvar tratamento" />
        )}
      </View>
    </Screen>
  );
}

function Connected() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  return (
    <TreatmentForm
      manageTreatment={getContainer().treatmentForPatient(patientId).manageTreatment}
    />
  );
}

export default function NewTreatmentScreen(props) {
  return props?.manageTreatment ? <TreatmentForm {...props} /> : <Connected />;
}

const styles = StyleSheet.create({
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  step: { alignItems: 'center', flex: 1, gap: spacing.xs },
  stepDot: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepDotActive: { backgroundColor: colors.action },
  stepNumber: { ...typography.caption, color: colors.textTertiary },
  stepNumberActive: { color: colors.textInverse },
  stepLabel: { ...typography.micro, color: colors.textTertiary, textAlign: 'center' },
  stepLabelActive: { color: colors.textPrimary, fontWeight: '700' },
  shortcutBlock: { gap: spacing.sm },
  shortcutLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  shortcutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryName: { ...typography.subtitle, color: colors.textPrimary },
  summaryDetail: { ...typography.body, color: colors.textSecondary },
  navigation: { flexDirection: 'row', gap: spacing.md },
});
