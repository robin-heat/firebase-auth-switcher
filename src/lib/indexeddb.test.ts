import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { readAuth, writeAuth, clearAuth } from './indexeddb';
import type { AuthState } from './types';

const mockAuthState: AuthState = {
  uid: 'uid-123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoURL: null,
  isAnonymous: false,
  providerData: [],
  stsTokenManager: {
    refreshToken: 'refresh-tok',
    accessToken: 'access-tok',
    expirationTime: Date.now() + 3600000,
  },
  createdAt: '1234567890000',
  lastLoginAt: '1234567890000',
  apiKey: 'fake-api-key',
  appName: '[DEFAULT]',
};

describe('indexeddb auth state', () => {
  beforeEach(async () => {
    await clearAuth('fake-api-key', 'demo-project');
  });

  it('returns null when no auth state stored', async () => {
    const result = await readAuth('fake-api-key', 'demo-project');
    expect(result).toBeNull();
  });

  it('writes and reads back auth state', async () => {
    await writeAuth(mockAuthState, 'demo-project');
    const result = await readAuth('fake-api-key', 'demo-project');
    expect(result).toEqual(mockAuthState);
  });

  it('clearAuth removes the stored state', async () => {
    await writeAuth(mockAuthState, 'demo-project');
    await clearAuth('fake-api-key', 'demo-project');
    const result = await readAuth('fake-api-key', 'demo-project');
    expect(result).toBeNull();
  });
});
