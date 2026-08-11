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
    } catch (submissionError) {
      setError(submissionError?.message || 'Sign-in failed. Check your details and try again.');
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
          <Text style={styles.description}>Sign in to manage epilepsy care records.</Text>
        </View>
        <FormField
          accessibilityHint="Enter the email for your MySeizures account"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          textContentType="emailAddress"
          value={email}
        />
        <FormField
          accessibilityHint="Enter your MySeizures account password"
          autoCapitalize="none"
          autoComplete="password"
          label="Password"
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
          accessibilityHint="Authenticates your account and opens your care area"
          accessibilityLabel="Sign in"
          busy={busy}
          onPress={submit}
          title="Sign in"
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
