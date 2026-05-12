import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('shows green dot when connected', () => {
    render(<Header connected={true} host="localhost" port={9099} />);
    expect(screen.getByTestId('status-dot')).toHaveStyle({ background: '#4caf50' });
  });

  it('shows red dot when disconnected', () => {
    render(<Header connected={false} host="localhost" port={9099} />);
    expect(screen.getByTestId('status-dot')).toHaveStyle({ background: '#f44336' });
  });

  it('shows host and port', () => {
    render(<Header connected={true} host="localhost" port={9099} />);
    expect(screen.getByText(/localhost:9099/)).toBeInTheDocument();
  });
});
