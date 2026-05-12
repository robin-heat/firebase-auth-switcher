import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from './Settings';

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_keys: string[], cb: (r: Record<string, unknown>) => void) => {
        cb({ config: { host: 'localhost', port: 9099, projectId: 'demo' } });
      }
    );
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockImplementation(
      (_data: unknown, cb: () => void) => cb()
    );
  });

  it('renders three input fields', async () => {
    render(<Settings />);
    expect(await screen.findByLabelText('Host')).toBeInTheDocument();
    expect(screen.getByLabelText('Port')).toBeInTheDocument();
    expect(screen.getByLabelText('Project ID')).toBeInTheDocument();
  });

  it('pre-fills fields from stored config', async () => {
    render(<Settings />);
    expect(await screen.findByDisplayValue('localhost')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9099')).toBeInTheDocument();
    expect(screen.getByDisplayValue('demo')).toBeInTheDocument();
  });

  it('saves updated config on submit', async () => {
    render(<Settings />);
    await screen.findByLabelText('Project ID');
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'new-project' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { config: { host: 'localhost', port: 9099, projectId: 'new-project' } },
        expect.any(Function)
      );
    });
  });
});
