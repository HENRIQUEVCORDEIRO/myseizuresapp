import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccessibleButton, FormField } from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

export default function SignInScreen() {
  const { signIn } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    setBusy(true);
    setError(null);

    try {
      await signIn({ email, password });
    } catch {
      setError('Não foi possível entrar. Verifique seus dados e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            MySeizures
          </Text>
          <Text style={styles.description}>Entre para gerenciar seus registros de epilepsia.</Text>
        </View>
        <FormField
          accessibilityHint="Informe o e-mail da sua conta MySeizures"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="E-mail"
          onChangeText={setEmail}
          textContentType="emailAddress"
          value={email}
        />
        <FormField
          accessibilityHint="Informe a senha da sua conta MySeizures"
          autoCapitalize="none"
          autoComplete="password"
          label="Senha"
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          value={password}
        />
        {error ? (
          <Text accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <AccessibleButton
          accessibilityHint="Autentica sua conta e abre sua área de cuidado"
          accessibilityLabel="Entrar"
          busy={busy}
          onPress={submit}
          title="Entrar"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, justifyContent: 'center', padding: 24 },
  heading: { gap: 8, marginBottom: 8 },
  title: { color: '#17324D', fontSize: 32, fontWeight: '700' },
  description: { color: '#334155', fontSize: 18, lineHeight: 28 },
  error: { color: '#B42318', fontSize: 15, lineHeight: 22 },
});
