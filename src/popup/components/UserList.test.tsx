import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserList } from './UserList';
import type { EmulatorUser } from '../../lib/types';

const users: EmulatorUser[] = [
  { localId: 'uid-1', email: 'alex@example.com', displayName: 'Alex' },
  { localId: 'uid-2', email: 'mario@example.com', displayName: 'Mario' },
];

describe('UserList', () => {
  it('renders a row for each user', () => {
    render(
      <UserList
        users={users}
        onSwitch={vi.fn()}
        loadingUid={null}
        onLoadMore={vi.fn()}
        hasMore={false}
      />
    );
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('mario@example.com')).toBeInTheDocument();
  });

  it('shows empty state when no users', () => {
    render(
      <UserList
        users={[]}
        onSwitch={vi.fn()}
        loadingUid={null}
        onLoadMore={vi.fn()}
        hasMore={false}
      />
    );
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it('passes isLoading=true only to the loading user row', () => {
    render(
      <UserList
        users={users}
        onSwitch={vi.fn()}
        loadingUid="uid-1"
        onLoadMore={vi.fn()}
        hasMore={false}
      />
    );
    const buttons = screen.getAllByRole('button', { name: /switch/i });
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
  });
});
