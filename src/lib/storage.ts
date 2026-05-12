import { DEFAULT_CONFIG, type Config } from './types';

export function getConfig(): Promise<Config> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['config'], (result) => {
      resolve((result.config as Config) ?? DEFAULT_CONFIG);
    });
  });
}

export function setConfig(config: Config): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ config }, resolve);
  });
}
