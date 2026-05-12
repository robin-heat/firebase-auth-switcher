import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConfig, setConfig } from './storage';
import type { Config } from './types';

describe('getConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stored config when present', async () => {
    const stored: Config = { host: '127.0.0.1', port: 9099, projectId: 'my-project' };
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_keys: string[], callback: (result: Record<string, unknown>) => void) => {
        callback({ config: stored });
      }
    );
    const result = await getConfig();
    expect(result).toEqual(stored);
  });

  it('returns DEFAULT_CONFIG when nothing stored', async () => {
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_keys: string[], callback: (result: Record<string, unknown>) => void) => {
        callback({});
      }
    );
    const result = await getConfig();
    expect(result).toEqual({ host: 'localhost', port: 9099, projectId: '' });
  });
});

describe('setConfig', () => {
  it('stores config under "config" key', async () => {
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockImplementation(
      (_data: unknown, callback: () => void) => { callback(); }
    );
    const config: Config = { host: 'localhost', port: 9099, projectId: 'demo' };
    await setConfig(config);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ config }, expect.any(Function));
  });
});
