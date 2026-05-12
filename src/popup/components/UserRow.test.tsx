import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserRow } from './UserRow';
import type { EmulatorUser } from '../../lib/types';

const user: EmulatorUser = {
  localId: 'uid-123',
  email: 'alex@example.com',
  displayName: 'Alex M.',
};

describe('UserRow', () => {
  it('renders email and display name', () => {
    render(<UserRow user={user} onSwitch={vi.fn()} isLoading={false} />);
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('Alex M.')).toBeInTheDocument();
  });

  it('renders avatar initial from email', () => {
    render(<UserRow user={user} onSwitch={vi.fn()} isLoading={false} />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('A');
  });

  it('calls onSwitch with user when Switch clicked', () => {
    const onSwitch = vi.fn();
    render(<UserRow user={user} onSwitch={onSwitch} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /switch/i }));
    expect(onSwitch).toHaveBeenCalledWith(user);
  });

  it('disables button while loading', () => {
    render(<UserRow user={user} onSwitch={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: /switch/i })).toBeDisabled();
  });

  it('shows uid when no email', () => {
    render(
      <UserRow
        user={{ localId: 'anon-uid' }}
        onSwitch={vi.fn()}
        isLoading={false}
      />
    );
    expect(screen.getByText('anon-uid')).toBeInTheDocument();
  });
});
