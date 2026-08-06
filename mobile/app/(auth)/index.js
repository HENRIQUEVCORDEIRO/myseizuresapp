import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function SignInPlaceholderScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          MySeizures
        </Text>
        <Text style={styles.description}>A tela de acesso estará disponível em breve.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#17324D',
    fontSize: 32,
    fontWeight: '700',
  },
  description: {
    color: '#334155',
    fontSize: 18,
    lineHeight: 28,
  },
});
