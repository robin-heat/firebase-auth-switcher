import { forgeCustomToken } from './token-forge';
import type { Config, EmulatorUser } from './types';

function baseUrl(config: Config): string {
  return `http://${config.host}:${config.port}`;
}

export interface ListUsersResult {
  users: EmulatorUser[];
  nextPageToken?: string;
}

export async function listUsers(
  config: Config,
  pageToken?: string
): Promise<ListUsersResult> {
  const url = `${baseUrl(config)}/identitytoolkit.googleapis.com/v1/projects/${config.projectId}/accounts:query`;
  const body: Record<string, unknown> = { returnUserInfo: true, maxResults: 500 };
  if (pageToken) body.nextPageToken = pageToken;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Emulator error ${res.status}: ${text}`);
  }

  return res.json() as Promise<ListUsersResult>;
}

export interface IdTokenResult {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

export async function getIdToken(
  uid: string,
  config: Config
): Promise<IdTokenResult> {
  const customToken = forgeCustomToken(uid, config.projectId);
  const url = `${baseUrl(config)}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Emulator signIn error ${res.status}: ${text}`);
  }

  return res.json() as Promise<IdTokenResult>;
}
