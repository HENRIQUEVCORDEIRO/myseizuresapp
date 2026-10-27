import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../../../src/presentation/theme/tokens.js';

/**
 * Patient tab bar.
 *
 * Four destinations, always visible: the user must be able to see where they can go without
 * remembering a menu. Icons are text glyphs on purpose — they avoid a native icon dependency and
 * render identically on every platform.
 */
const TABS = Object.freeze([
  { glyph: '🏠', name: 'index', title: 'Início' },
  { glyph: '📅', name: 'calendar', title: 'Registros' },
  { glyph: '💊', name: 'treatments', title: 'Tratamentos' },
  { glyph: '🔗', name: 'sharing', title: 'Compartilhamento', visibleTitle: 'Compartilhar' },
]);

function TabIcon({ color, glyph }) {
  return (
    <Text maxFontSizeMultiplier={1.2} style={[styles.icon, { color }]}>
      {glyph}
    </Text>
  );
}

export default function PatientTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.action,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: [styles.bar, { height: 62 + insets.bottom, paddingBottom: insets.bottom }],
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color }) => <TabIcon color={color} glyph={tab.glyph} />,
            tabBarLabel: ({ color }) => (
              <Text
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
                minimumFontScale={0.8}
                numberOfLines={1}
                style={[styles.label, { color }]}
              >
                {tab.visibleTitle ?? tab.title}
              </Text>
            ),
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
    paddingTop: spacing.xs,
  },
  icon: { fontSize: 20 },
  label: { ...typography.micro, fontWeight: '600' },
};
