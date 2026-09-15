import { Link, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccessibleButton } from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

const CARE_TOOLS = Object.freeze([
  {
    description: 'Add the date, time, and type of a seizure.',
    href: '/(patient)/seizures/new',
    title: 'Record seizure',
  },
  {
    description: 'Record possible triggers, sleep quality, and mood.',
    href: '/(patient)/triggers/new',
    title: 'Record triggers',
  },
  {
    description: 'Review your seizure and trigger history.',
    href: '/(patient)/calendar',
    title: 'Calendar and history',
  },
  {
    description: 'Add or update your medications and schedules.',
    href: '/(patient)/treatments',
    title: 'Treatments',
  },
  {
    description: 'Review and confirm medication doses.',
    href: '/(patient)/reminders',
    title: 'Reminders and adherence',
  },
  {
    description: 'Manage care-information access for professionals.',
    href: '/(patient)/sharing',
    title: 'Professional access sharing',
  },
]);

export function PatientHome({ onSwitchProfile, user }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Patient care
          </Text>
          <Text style={styles.description}>Welcome, {user?.name}. Choose a care tool.</Text>
        </View>
        <View accessibilityLabel="Patient care tools" accessibilityRole="list" style={styles.tools}>
          {CARE_TOOLS.map((tool) => (
            <Link
              accessibilityHint={tool.description}
              accessibilityLabel={tool.title}
              accessibilityRole="link"
              href={tool.href}
              key={tool.href}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardDescription}>{tool.description}</Text>
            </Link>
          ))}
        </View>
        <AccessibleButton
          accessibilityHint="Clears this profile and returns to the sign-in screen"
          accessibilityLabel="Switch profile"
          onPress={onSwitchProfile}
          title="Switch profile"
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const { signOut, user } = useAuthSession();

  async function switchProfile() {
    try {
      await signOut();
    } catch {
    } finally {
      router.replace('/(auth)');
    }
  }

  return <PatientHome onSwitchProfile={switchProfile} user={user} />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24 },
  heading: { gap: 8 },
  tools: { gap: 12 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 17, lineHeight: 26 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    minHeight: 76,
    padding: 16,
  },
  cardTitle: { color: '#17324D', fontSize: 17, fontWeight: '700' },
  cardDescription: { color: '#475467', fontSize: 15, lineHeight: 21 },
});
