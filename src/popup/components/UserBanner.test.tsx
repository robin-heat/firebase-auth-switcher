import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserBanner } from './UserBanner';

describe('UserBanner', () => {
  it('renders null when no current user', () => {
    const { container } = render(<UserBanner currentUser={null} onSignOut={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows email when user is set', () => {
    render(
      <UserBanner
        currentUser={{ email: 'anna@example.com', uid: 'uid-1' }}
        onSignOut={vi.fn()}
      />
    );
    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
  });

  it('calls onSignOut when Sign out clicked', () => {
    const onSignOut = vi.fn();
    render(
      <UserBanner
        currentUser={{ email: 'anna@example.com', uid: 'uid-1' }}
        onSignOut={onSignOut}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('shows uid when no email', () => {
    render(
      <UserBanner
        currentUser={{ email: null, uid: 'anon-uid' }}
        onSignOut={vi.fn()}
      />
    );
    expect(screen.getByText('anon-uid')).toBeInTheDocument();
  });
});
