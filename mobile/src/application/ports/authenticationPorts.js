import { definePort } from './definePort.js';

export const AuthenticationPort = definePort('AuthenticationPort', [
  'authenticate',
  'getCurrentUser',
  'signOut',
]);

export const SessionStorePort = definePort('SessionStorePort', [
  'saveSession',
  'loadSession',
  'clearSession',
]);
