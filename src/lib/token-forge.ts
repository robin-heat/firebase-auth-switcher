function base64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlJson(obj: unknown): string {
  return base64url(JSON.stringify(obj));
}

export function forgeCustomToken(uid: string, projectId: string): string {
  const serviceAccount = `firebase-auth-switcher@${projectId}.iam.gserviceaccount.com`;
  const now = Math.floor(Date.now() / 1000);

  const header = base64urlJson({ alg: 'RS256', typ: 'JWT' });
  const payload = base64urlJson({
    iss: serviceAccount,
    sub: serviceAccount,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    uid,
    iat: now,
    exp: now + 3600,
  });
  const fakeSignature = base64url('firebase-auth-switcher-fake-sig');

  return `${header}.${payload}.${fakeSignature}`;
}
