import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserRow } from './UserRow';
import type { EmulatorUser } from '../../lib/types';

const user: EmulatorUser = {
  localId: 'uid-123',
  email: 'alex@example.com',
  displayName: 'Alex M.',
};

const defaultProps = { onSwitch: vi.fn(), onSignOut: vi.fn(), isLoading: false, isCurrent: false };

describe('UserRow', () => {
  it('renders email and display name', () => {
    render(<UserRow user={user} {...defaultProps} />);
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('Alex M.')).toBeInTheDocument();
  });

  it('renders avatar initial from email', () => {
    render(<UserRow user={user} {...defaultProps} />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('A');
  });

  it('calls onSwitch with user when Switch clicked', () => {
    const onSwitch = vi.fn();
    render(<UserRow user={user} {...defaultProps} onSwitch={onSwitch} />);
    fireEvent.click(screen.getByRole('button', { name: /switch/i }));
    expect(onSwitch).toHaveBeenCalledWith(user);
  });

  it('disables button while loading', () => {
    render(<UserRow user={user} {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button', { name: /switch/i })).toBeDisabled();
  });

  it('shows uid when no email', () => {
    render(<UserRow user={{ localId: 'anon-uid' }} {...defaultProps} />);
    expect(screen.getByText('anon-uid')).toBeInTheDocument();
  });

  it('shows Logout button when isCurrent', () => {
    const onSignOut = vi.fn();
    render(<UserRow user={user} {...defaultProps} isCurrent={true} onSignOut={onSignOut} />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /switch/i })).toBeNull();
  });

  it('calls onSignOut when Logout clicked', () => {
    const onSignOut = vi.fn();
    render(<UserRow user={user} {...defaultProps} isCurrent={true} onSignOut={onSignOut} />);
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
