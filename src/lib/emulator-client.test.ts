import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listUsers, getIdToken } from './emulator-client';
import type { Config } from './types';

const config: Config = { host: 'localhost', port: 9099, projectId: 'demo-project' };

describe('listUsers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches users from emulator query endpoint', async () => {
    const mockUsers = [{ localId: 'uid1', email: 'a@b.com' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: mockUsers }),
    } as Response);

    const result = await listUsers(config);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/demo-project/accounts:query',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.users).toEqual(mockUsers);
  });

  it('passes pageToken when provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response);

    await listUsers(config, 'token-abc');
    const body = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.nextPageToken).toBe('token-abc');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as unknown as Response);

    await expect(listUsers(config)).rejects.toThrow('Emulator error 400');
  });
});

describe('getIdToken', () => {
  it('exchanges custom token for idToken and refreshToken', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        idToken: 'id-token-value',
        refreshToken: 'refresh-token-value',
        expiresIn: '3600',
      }),
    } as Response);

    const result = await getIdToken('uid-abc', config);
    expect(result.idToken).toBe('id-token-value');
    expect(result.refreshToken).toBe('refresh-token-value');
  });
});
