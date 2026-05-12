import styles from './UserBanner.module.css';

interface CurrentUser {
  email: string | null;
  uid: string;
}

interface Props {
  currentUser: CurrentUser | null;
  onSignOut: () => void;
}

export function UserBanner({ currentUser, onSignOut }: Props) {
  if (!currentUser) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.label}>
        <span className={styles.dot}>●</span>
        {currentUser.email ?? currentUser.uid}
      </span>
      <button className={styles.signOutButton} onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
