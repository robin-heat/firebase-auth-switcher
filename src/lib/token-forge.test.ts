import { describe, it, expect } from 'vitest';
import { forgeCustomToken } from './token-forge';

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const [, payloadB64] = jwt.split('.');
  return JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
}

describe('forgeCustomToken', () => {
  it('returns a three-part JWT string', () => {
    const token = forgeCustomToken('uid-123', 'my-project');
    expect(token.split('.')).toHaveLength(3);
  });

  it('encodes uid in payload', () => {
    const token = forgeCustomToken('uid-abc', 'my-project');
    const payload = decodeJwtPayload(token);
    expect(payload.uid).toBe('uid-abc');
  });

  it('sets correct aud claim', () => {
    const token = forgeCustomToken('uid-abc', 'my-project');
    const payload = decodeJwtPayload(token);
    expect(payload.aud).toBe(
      'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'
    );
  });

  it('sets iss and sub to service account format', () => {
    const token = forgeCustomToken('uid-abc', 'my-project');
    const payload = decodeJwtPayload(token);
    expect(payload.iss).toBe('firebase-auth-switcher@my-project.iam.gserviceaccount.com');
    expect(payload.sub).toBe('firebase-auth-switcher@my-project.iam.gserviceaccount.com');
  });

  it('sets exp 1 hour after iat', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = forgeCustomToken('uid-abc', 'my-project');
    const payload = decodeJwtPayload(token);
    expect(payload.exp as number).toBeGreaterThanOrEqual(before + 3600);
    expect(payload.exp as number).toBeLessThanOrEqual(before + 3601);
  });
});
