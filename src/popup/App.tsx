import { useEffect, useMemo, useState } from 'react';
import { getConfig } from '../lib/storage';
import { listUsers, getIdToken } from '../lib/emulator-client';
import { readCurrentUser, injectAuth, clearCurrentUser } from '../lib/page-bridge';
import type { AuthState, Config, EmulatorUser } from '../lib/types';
import { Header } from './components/Header';
import { UserBanner } from './components/UserBanner';
import { SearchInput } from './components/SearchInput';
import { UserList } from './components/UserList';
import styles from './App.module.css';

const _appMount = performance.now();

export function App() {
  console.log(`[popup] App() mounted  +${(_appMount).toFixed(0)}ms`);

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
    const t = performance.now();
    console.log(`[popup] getConfig() start  +${t.toFixed(0)}ms`);
    getConfig().then(async (cfg) => {
      console.log(`[popup] getConfig() done  +${(performance.now() - t).toFixed(0)}ms (storage round-trip)`);
      setConfig(cfg);
      if (!cfg.projectId) { console.warn('[popup] no projectId configured'); return; }
      try {
        const t2 = performance.now();
        const result = await listUsers(cfg);
        console.log(`[popup] listUsers() done  +${(performance.now() - t2).toFixed(0)}ms`);
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
    const t = performance.now();
    console.log(`[popup] readCurrentUser() start  +${t.toFixed(0)}ms`);
    readCurrentUser().then((user) => {
      console.log(`[popup] readCurrentUser() done  +${(performance.now() - t).toFixed(0)}ms  user=${user?.uid ?? 'none'}`);
      if (user) setCurrentUser({ email: user.email, uid: user.uid });
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
      await injectAuth(authState, config.firebaseApiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Switch failed');
      setLoadingUid(null);
    }
  }

  function handleSignOut() {
    clearCurrentUser();
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
        onSignOut={handleSignOut}
        loadingUid={loadingUid}
        currentUid={currentUser?.uid ?? null}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
      <div className={styles.footer}>
        {config.projectId} · {allUsers.length} users
      </div>
    </div>
  );
}
