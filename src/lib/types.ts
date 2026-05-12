export interface Config {
  host: string;
  port: number;
  projectId: string;
  firebaseApiKey: string;
}

export const DEFAULT_CONFIG: Config = {
  host: 'localhost',
  port: 9099,
  projectId: '',
  firebaseApiKey: '',
};

export interface EmulatorUser {
  localId: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  providerUserInfo?: Array<{
    providerId: string;
    email?: string;
    displayName?: string;
    photoUrl?: string;
    rawId?: string;
  }>;
  createdAt?: string;
  lastLoginAt?: string;
  passwordHash?: string;
}

export interface AuthState {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerData: Array<{
    providerId: string;
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
  }>;
  stsTokenManager: {
    refreshToken: string;
    accessToken: string;
    expirationTime: number;
  };
  createdAt: string;
  lastLoginAt: string;
  apiKey: string;
  appName: string;
}

export type MessageType =
  | { type: 'SWITCH_USER'; payload: AuthState }
  | { type: 'GET_CURRENT_USER' }
  | { type: 'SIGN_OUT' };

export type MessageResponse =
  | { success: true; user: AuthState | null }
  | { success: false; error: string };
