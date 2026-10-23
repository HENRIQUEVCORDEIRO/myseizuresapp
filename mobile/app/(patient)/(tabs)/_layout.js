import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors, spacing, typography } from '../../../src/presentation/theme/tokens.js';

/**
 * Patient tab bar.
 *
 * Four destinations, always visible: the user must be able to see where they can go without
 * remembering a menu. Icons are text glyphs on purpose — they avoid a native icon dependency and
 * render identically on every platform.
 */
const TABS = Object.freeze([
  { glyph: '🏠', name: 'index', title: 'Home' },
  { glyph: '📅', name: 'calendar', title: 'Records' },
  { glyph: '💊', name: 'treatments', title: 'Treatments' },
  { glyph: '🔗', name: 'sharing', title: 'Sharing' },
]);

function TabIcon({ color, glyph }) {
  return <Text style={[styles.icon, { color }]}>{glyph}</Text>;
}

export default function PatientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.action,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ color }) => <TabIcon color={color} glyph={tab.glyph} />,
            tabBarLabel: tab.title,
            title: tab.title,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = {
  bar: {
    backgroundColor: colors.surfaceBase,
    borderTopColor: colors.borderDefault,
    borderTopWidth: 1,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  icon: { fontSize: 20 },
  label: { ...typography.micro, fontWeight: '600' },
};
