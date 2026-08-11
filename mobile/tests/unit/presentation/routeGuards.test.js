import React from 'react';
import { act, create } from 'react-test-renderer';

import { ProtectedRoute } from '../../../src/presentation/navigation/ProtectedRoute.js';
import { useAuthSession } from '../../../src/presentation/navigation/AuthSessionProvider.js';

jest.mock('expo-router', () => {
  const ReactModule = require('react');

  return {
    Redirect: (props) => ReactModule.createElement('Redirect', props),
  };
});

jest.mock('../../../src/presentation/navigation/AuthSessionProvider.js', () => ({
  useAuthSession: jest.fn(),
}));

describe('ProtectedRoute', () => {
  test('renders a redirect instead of protected content for an unauthenticated user', () => {
    useAuthSession.mockReturnValue({
      error: null,
      retry: jest.fn(),
      status: 'unauthenticated',
      user: null,
    });
    let renderer;

    act(() => {
      renderer = create(
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <span>Private content</span>
        </ProtectedRoute>,
      );
    });

    expect(renderer.root.findByType('Redirect').props.href).toBe('/(auth)');
    expect(renderer.root.findAllByType('span')).toHaveLength(0);
  });

  test('renders protected content when the authenticated role is allowed', () => {
    useAuthSession.mockReturnValue({
      error: null,
      retry: jest.fn(),
      status: 'authenticated',
      user: { id: 1, role: 'PATIENT' },
    });
    let renderer;

    act(() => {
      renderer = create(
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <span>Private content</span>
        </ProtectedRoute>,
      );
    });

    expect(renderer.root.findByType('span').children).toEqual(['Private content']);
    expect(renderer.root.findAllByType('Redirect')).toHaveLength(0);
  });
});
