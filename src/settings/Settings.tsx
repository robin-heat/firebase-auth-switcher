import { useEffect, useState } from 'react';
import { getConfig, setConfig } from '../lib/storage';
import type { Config } from '../lib/types';
import styles from './Settings.module.css';

export function Settings() {
  const [config, setLocalConfig] = useState<Config>({
    host: 'localhost',
    port: 9099,
    projectId: '',
    firebaseApiKey: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getConfig().then((cfg) => setLocalConfig({ firebaseApiKey: '', ...cfg }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await setConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.settings}>
      <h1 className={styles.title}>Settings</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>
          <span>Host</span>
          <input
            aria-label="Host"
            value={config.host}
            onChange={(e) => setLocalConfig({ ...config, host: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>Port</span>
          <input
            aria-label="Port"
            type="number"
            value={config.port}
            onChange={(e) => setLocalConfig({ ...config, port: Number(e.target.value) })}
          />
        </label>
        <label className={styles.field}>
          <span>Project ID</span>
          <input
            aria-label="Project ID"
            value={config.projectId}
            onChange={(e) => setLocalConfig({ ...config, projectId: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>Firebase API Key</span>
          <input
            aria-label="Firebase API Key"
            value={config.firebaseApiKey}
            placeholder="e.g. demo-api-key"
            onChange={(e) => setLocalConfig({ ...config, firebaseApiKey: e.target.value })}
          />
        </label>
        <button type="submit" className={styles.saveButton}>
          {saved ? 'Saved' : 'Save'}
        </button>
      </form>
    </div>
  );
}
