import styles from './Header.module.css';

interface Props {
  connected: boolean;
  host: string;
  port: number;
}

export function Header({ connected, host, port }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span
          data-testid="status-dot"
          className={styles.dot}
          style={{ background: connected ? '#4caf50' : '#f44336' }}
        />
        <span className={styles.title}>Auth Switcher</span>
      </div>
      <div className={styles.right}>
        <span className={styles.meta}>{host}:{port}</span>
        <a
          className={styles.settingsLink}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
          }}
        >
          ⚙
        </a>
      </div>
    </header>
  );
}
