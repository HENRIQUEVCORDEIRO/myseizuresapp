import { act, create } from 'react-test-renderer';

import PatientHomeScreen from '../../app/(patient)/index.js';
import { useAuthSession } from '../../src/presentation/navigation/AuthSessionProvider.js';
import { useRouter } from 'expo-router';

jest.mock('expo-router', () => {
  const ReactModule = require('react');

  return {
    Link: ({ children, ...props }) => ReactModule.createElement('Link', props, children),
    useRouter: jest.fn(),
  };
});

jest.mock('../../src/presentation/navigation/AuthSessionProvider.js', () => ({
  useAuthSession: jest.fn(),
}));

const DESTINATIONS = [
  ['Record seizure', '/(patient)/seizures/new'],
  ['Record triggers', '/(patient)/triggers/new'],
  ['Calendar and history', '/(patient)/calendar'],
  ['Treatments', '/(patient)/treatments'],
  ['Reminders and adherence', '/(patient)/reminders'],
  ['Professional access sharing', '/(patient)/sharing'],
];

function renderPatientHome({ signOut = jest.fn().mockResolvedValue(undefined) } = {}) {
  const router = { replace: jest.fn() };
  useRouter.mockReturnValue(router);
  useAuthSession.mockReturnValue({
    signOut,
    user: { id: 1, name: 'Patient One', role: 'PATIENT' },
  });
  let renderer;

  act(() => {
    renderer = create(<PatientHomeScreen />);
  });

  return { renderer, router, signOut };
}

describe('patient home navigation', () => {
  test('renders clear entry points for every patient workflow', () => {
    const { renderer } = renderPatientHome();
    const links = renderer.root.findAllByType('Link');

    expect(links.map(({ props }) => [props.accessibilityLabel, props.href])).toEqual(DESTINATIONS);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Patient care tools' })).toBeTruthy();
  });

  test('clears the active session before safely returning to authentication', async () => {
    const { renderer, router, signOut } = renderPatientHome();

    await act(async () => {
      await renderer.root.findByProps({ accessibilityLabel: 'Switch profile' }).props.onPress();
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/(auth)');
  });

  test('returns to authentication even when remote sign-out reports an error', async () => {
    const { renderer, router } = renderPatientHome({
      signOut: jest.fn().mockRejectedValue(new Error('Remote service unavailable.')),
    });

    await act(async () => {
      await renderer.root.findByProps({ accessibilityLabel: 'Switch profile' }).props.onPress();
    });

    expect(router.replace).toHaveBeenCalledWith('/(auth)');
  });
});
