import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UpcomingEvents from '../components/UpcomingEvents';
import { BrowserRouter } from 'react-router-dom';

describe('UpcomingEvents', () => {
  it('renders upcoming events title', () => {
    render(
      <BrowserRouter>
        <UpcomingEvents />
      </BrowserRouter>
    );
    expect(screen.getByText(/Upcoming Events/i)).toBeInTheDocument();
  });

  it('renders the Lagos location', () => {
    render(
      <BrowserRouter>
        <UpcomingEvents />
      </BrowserRouter>
    );
    // Use getAllByText since multiple elements might contain the city name
    expect(screen.getAllByText(/Lagos/i).length).toBeGreaterThan(0);
  });
});
