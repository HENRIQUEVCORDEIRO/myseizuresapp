import { act, create } from 'react-test-renderer';

import { UserRole } from '../../src/domain/value-objects/index.js';
import { ProtectedRoute } from '../../src/presentation/navigation/ProtectedRoute.js';
import { useAuthSession } from '../../src/presentation/navigation/AuthSessionProvider.js';

jest.mock('expo-router', () => {
  const ReactModule = require('react');
  return { Redirect: (props) => ReactModule.createElement('Redirect', props) };
});

jest.mock('../../src/presentation/navigation/AuthSessionProvider.js', () => ({
  useAuthSession: jest.fn(),
}));

function renderProfessionalArea(user) {
  useAuthSession.mockReturnValue({
    error: null,
    retry: jest.fn(),
    status: user ? 'authenticated' : 'unauthenticated',
    user,
  });
  let renderer;
  act(() => {
    renderer = create(
      <ProtectedRoute allowedRoles={[UserRole.MEDIC_CARETAKER]}>
        <span>Patient 1 clinical report: private seizure details</span>
      </ProtectedRoute>,
    );
  });
  return renderer;
}

describe('professional clinical-data access presentation', () => {
  test('renders authorized report content for the professional role', () => {
    const renderer = renderProfessionalArea({ id: 2, role: UserRole.MEDIC_CARETAKER });
    expect(renderer.root.findByType('span').children.join('')).toContain('private seizure details');
  });

  test('shows a non-disclosing denied state and never renders clinical data for the patient role', () => {
    const renderer = renderProfessionalArea({ id: 1, role: UserRole.PATIENT });
    expect(renderer.root.findAllByType('span')).toHaveLength(0);
    expect(renderer.root.findByProps({ accessibilityRole: 'alert' })).toBeTruthy();
    expect(JSON.stringify(renderer.toJSON())).toMatch(/Access denied/);
    expect(JSON.stringify(renderer.toJSON())).not.toMatch(/Patient 1|seizure details/i);
  });

  test('redirects an unauthenticated actor without rendering clinical data', () => {
    const renderer = renderProfessionalArea(null);
    expect(renderer.root.findByType('Redirect').props.href).toBe('/(auth)');
    expect(renderer.root.findAllByType('span')).toHaveLength(0);
  });
});
