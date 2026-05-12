import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserList } from './UserList';
import type { EmulatorUser } from '../../lib/types';

const users: EmulatorUser[] = [
  { localId: 'uid-1', email: 'alex@example.com', displayName: 'Alex' },
  { localId: 'uid-2', email: 'mario@example.com', displayName: 'Mario' },
];

const defaultProps = { onSwitch: vi.fn(), onSignOut: vi.fn(), loadingUid: null, currentUid: null, onLoadMore: vi.fn(), hasMore: false };

describe('UserList', () => {
  it('renders a row for each user', () => {
    render(<UserList users={users} {...defaultProps} />);
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('mario@example.com')).toBeInTheDocument();
  });

  it('shows empty state when no users', () => {
    render(<UserList users={[]} {...defaultProps} />);
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it('passes isLoading=true only to the loading user row', () => {
    render(<UserList users={users} {...defaultProps} loadingUid="uid-1" />);
    const buttons = screen.getAllByRole('button', { name: /switch/i });
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
  });

  it('shows Logout button for the current user', () => {
    render(<UserList users={users} {...defaultProps} currentUid="uid-1" />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /switch/i })).toHaveLength(1);
  });
});
