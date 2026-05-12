import { useEffect, useMemo, useState } from 'react';
import { getConfig } from '../lib/storage';
import { listUsers, getIdToken } from '../lib/emulator-client';
import type { AuthState, Config, EmulatorUser } from '../lib/types';
import { Header } from './components/Header';
import { UserBanner } from './components/UserBanner';
import { SearchInput } from './components/SearchInput';
import { UserList } from './components/UserList';
import styles from './App.module.css';

export function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [connected, setConnected] = useState(false);
  const [allUsers, setAllUsers] = useState<EmulatorUser[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState('');
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string | null; uid: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConfig().then(async (cfg) => {
      setConfig(cfg);
      if (!cfg.projectId) return;
      try {
        const result = await listUsers(cfg);
        setAllUsers(result.users ?? []);
        setNextPageToken(result.nextPageToken);
        setHasMore(!!result.nextPageToken);
        setConnected(true);
      } catch (err) {
        setConnected(false);
        setError(err instanceof Error ? err.message : `Cannot connect to ${cfg.host}:${cfg.port}`);
      }
    });
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_USER' }, (response) => {
      if (response?.success && response.user) {
        setCurrentUser({ email: response.user.email, uid: response.user.uid });
      }
    });
  }, []);

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return allUsers;
    const q = query.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.localId.toLowerCase().includes(q)
    );
  }, [allUsers, query]);

  async function handleLoadMore() {
    if (!config || !nextPageToken) return;
    try {
      const result = await listUsers(config, nextPageToken);
      setAllUsers((prev) => [...prev, ...(result.users ?? [])]);
      setNextPageToken(result.nextPageToken);
      setHasMore(!!result.nextPageToken);
    } catch {
      // silently skip
    }
  }

  async function handleSwitch(user: EmulatorUser) {
    if (!config) return;
    setLoadingUid(user.localId);
    setError(null);
    try {
      const { idToken, refreshToken, expiresIn } = await getIdToken(user.localId, config);
      const authState: AuthState = {
        uid: user.localId,
        email: user.email ?? null,
        emailVerified: user.emailVerified ?? false,
        displayName: user.displayName ?? null,
        photoURL: user.photoUrl ?? null,
        isAnonymous: !user.email,
        providerData: (user.providerUserInfo ?? []).map((p) => ({
          providerId: p.providerId,
          uid: p.rawId ?? user.localId,
          email: p.email ?? null,
          displayName: p.displayName ?? null,
          photoURL: p.photoUrl ?? null,
          phoneNumber: null,
        })),
        stsTokenManager: {
          refreshToken,
          accessToken: idToken,
          expirationTime: Date.now() + Number(expiresIn) * 1000,
        },
        createdAt: user.createdAt ?? String(Date.now()),
        lastLoginAt: user.lastLoginAt ?? String(Date.now()),
        apiKey: 'fake-api-key',
        appName: '[DEFAULT]',
      };
      chrome.runtime.sendMessage({ type: 'SWITCH_USER', payload: authState });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Switch failed');
      setLoadingUid(null);
    }
  }

  function handleSignOut() {
    chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
    setCurrentUser(null);
  }

  if (!config) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.app}>
      <Header connected={connected} host={config.host} port={config.port} />
      <UserBanner currentUser={currentUser} onSignOut={handleSignOut} />
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.search}>
        <SearchInput value={query} onChange={setQuery} />
      </div>
      <UserList
        users={filteredUsers}
        onSwitch={handleSwitch}
        loadingUid={loadingUid}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
      <div className={styles.footer}>
        {config.projectId} · {allUsers.length} users
      </div>
    </div>
  );
}
