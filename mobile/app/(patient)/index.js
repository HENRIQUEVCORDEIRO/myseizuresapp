import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AccessibleButton } from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

export default function PatientHomeScreen() {
  const { signOut, user } = useAuthSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Patient care
        </Text>
        <Text style={styles.description}>Welcome, {user?.name}. Your care tools are ready.</Text>
        <AccessibleButton
          accessibilityHint="Ends your session and returns to the sign-in screen"
          accessibilityLabel="Sign out"
          onPress={signOut}
          title="Sign out"
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FFFFFF', flex: 1 },
  content: { flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 17, lineHeight: 26 },
});
