import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AccessibleButton } from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

export default function ProfessionalHomeScreen() {
  const { signOut, user } = useAuthSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Área do profissional
        </Text>
        <Text style={styles.description}>
          Bem-vindo(a), {user?.name}. As ferramentas de cuidado autorizadas estão prontas.
        </Text>
        <AccessibleButton
          accessibilityHint="Encerra sua sessão e retorna à tela de entrada"
          accessibilityLabel="Sair"
          onPress={signOut}
          title="Sair"
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
