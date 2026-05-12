import { useRef, useEffect } from 'react';
import type { EmulatorUser } from '../../lib/types';
import { UserRow } from './UserRow';
import styles from './UserList.module.css';

interface Props {
  users: EmulatorUser[];
  onSwitch: (user: EmulatorUser) => void;
  loadingUid: string | null;
  onLoadMore: () => void;
  hasMore: boolean;
}

export function UserList({ users, onSwitch, loadingUid, onLoadMore, hasMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (users.length === 0) {
    return <div className={styles.empty}>No users found</div>;
  }

  return (
    <div className={styles.list}>
      {users.map((user) => (
        <UserRow
          key={user.localId}
          user={user}
          onSwitch={onSwitch}
          isLoading={loadingUid === user.localId}
        />
      ))}
      {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
    </div>
  );
}
