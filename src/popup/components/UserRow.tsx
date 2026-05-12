import type { EmulatorUser } from '../../lib/types';
import styles from './UserRow.module.css';

const AVATAR_COLORS = [
  '#1565c0', '#6a1b9a', '#00695c', '#e65100',
  '#4a148c', '#1b5e20', '#b71c1c', '#0d47a1',
];

function avatarColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function avatarInitial(user: EmulatorUser): string {
  if (user.email) return user.email[0].toUpperCase();
  if (user.displayName) return user.displayName[0].toUpperCase();
  return '?';
}

interface Props {
  user: EmulatorUser;
  onSwitch: (user: EmulatorUser) => void;
  onSignOut: () => void;
  isLoading: boolean;
  isCurrent: boolean;
}

export function UserRow({ user, onSwitch, onSignOut, isLoading, isCurrent }: Props) {
  const label = user.email ?? user.localId;

  return (
    <div className={`${styles.row} ${isCurrent ? styles.current : ''}`}>
      <div
        data-testid="avatar"
        className={styles.avatar}
        style={{ background: avatarColor(user.localId) }}
      >
        {avatarInitial(user)}
      </div>
      <div className={styles.info}>
        <span className={styles.email}>{label}</span>
        {user.displayName && <span className={styles.name}>{user.displayName}</span>}
      </div>
      {isCurrent ? (
        <button
          className={styles.logoutButton}
          onClick={onSignOut}
          disabled={isLoading}
        >
          Logout
        </button>
      ) : (
        <button
          className={styles.switchButton}
          onClick={() => onSwitch(user)}
          disabled={isLoading}
        >
          Switch
        </button>
      )}
    </div>
  );
}
