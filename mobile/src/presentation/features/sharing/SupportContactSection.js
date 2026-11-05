import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AccessibleButton, FormFeedback, FormField } from '../../components/index.js';

function validateContact({ name, phone }) {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'Informe o nome do contato.';
  }

  if (!phone.trim()) {
    errors.phone = 'Informe o telefone do contato.';
  }

  return errors;
}

export function SupportContactSection({ manageSupportContact }) {
  const [contact, setContact] = useState(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);

  const loadContact = useCallback(async () => {
    setStatus('loading');
    setFeedback(null);
    try {
      const value = await manageSupportContact.load({});
      setContact(value);
      setName(value?.name ?? '');
      setRelationship(value?.relationship ?? '');
      setPhone(value?.phone ?? '');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [manageSupportContact]);

  useEffect(() => {
    void loadContact();
  }, [loadContact]);

  async function save() {
    const validationErrors = validateContact({ name, phone });
    setErrors(validationErrors);
    setFeedback(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      const saved = await manageSupportContact.save({ name, relationship, phone });
      setContact(saved);
      setName(saved.name);
      setRelationship(saved.relationship ?? '');
      setPhone(saved.phone);
      setFeedback({ message: 'Contato de confiança salvo.', variant: 'success' });
    } catch {
      setFeedback({
        message: 'Não foi possível salvar o contato de confiança. Tente novamente.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setFeedback(null);

    try {
      await manageSupportContact.clear({});
      setContact(null);
      setName('');
      setRelationship('');
      setPhone('');
      setErrors({});
      setFeedback({ message: 'Contato de confiança removido.', variant: 'success' });
    } catch {
      setFeedback({
        message: 'Não foi possível remover o contato de confiança. Tente novamente.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Contato de confiança
      </Text>
      <Text style={styles.description}>
        Uma pessoa que você quer manter por perto. Este contato fica apenas neste aparelho e não é
        compartilhado com profissionais.
      </Text>

      {status === 'loading' ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          Carregando contato de confiança...
        </Text>
      ) : null}

      {status === 'error' ? (
        <View style={styles.errorState}>
          <Text accessibilityLiveRegion="assertive" style={styles.errorText}>
            Não foi possível carregar o contato de confiança.
          </Text>
          <AccessibleButton
            accessibilityHint="Tenta carregar novamente o contato salvo neste aparelho"
            accessibilityLabel="Tentar carregar o contato de confiança novamente"
            onPress={loadContact}
            title="Tentar novamente"
            variant="secondary"
          />
        </View>
      ) : null}

      {status === 'success' ? (
        <View style={styles.form}>
          {contact ? (
            <Text accessibilityLiveRegion="polite" style={styles.saved}>
              Contato salvo: {contact.name}
            </Text>
          ) : null}
          <FormField
            accessibilityHint="Informe o nome da pessoa de confiança"
            autoCapitalize="words"
            error={errors.name}
            label="Nome do contato"
            onChangeText={setName}
            value={name}
          />
          <FormField
            accessibilityHint="Informe como essa pessoa é próxima de você"
            autoCapitalize="sentences"
            label="Relação"
            onChangeText={setRelationship}
            placeholder="Ex.: mãe, cônjuge, amigo"
            value={relationship}
          />
          <FormField
            accessibilityHint="Informe o telefone da pessoa de confiança"
            error={errors.phone}
            keyboardType="phone-pad"
            label="Telefone"
            onChangeText={setPhone}
            value={phone}
          />
          <FormFeedback message={feedback?.message} variant={feedback?.variant} />
          <AccessibleButton
            accessibilityHint="Salva o contato de confiança apenas neste aparelho"
            accessibilityLabel="Salvar contato de confiança"
            busy={busy}
            onPress={save}
            title="Salvar contato"
          />
          {contact ? (
            <AccessibleButton
              accessibilityHint="Remove o contato de confiança deste aparelho"
              accessibilityLabel="Remover contato de confiança"
              busy={busy}
              onPress={remove}
              title="Remover contato"
              variant="secondary"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 8 },
  sectionTitle: { color: '#17324D', fontSize: 21, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  form: { gap: 12 },
  status: { color: '#475467', fontSize: 15 },
  errorState: { gap: 12 },
  errorText: { color: '#B42318', fontSize: 15, lineHeight: 22 },
  saved: { color: '#067647', fontSize: 15, fontWeight: '700' },
});
