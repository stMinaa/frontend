/* eslint-disable testing-library/no-node-access, testing-library/no-container */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Home from './Home';

describe('Home Component', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SUCCESS SCENARIOS
  describe('Success Scenarios', () => {
    test('should render landing page with branding', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      // Check for Smartwalls branding
      expect(screen.getAllByText('Smartwalls').length).toBeGreaterThan(0);
      expect(screen.getByText("Tennet's assembly and building management")).toBeInTheDocument();
    });

    test('should render navigation buttons', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    test('should render video background component', () => {
      const { container } = render(<Home onNavigate={mockOnNavigate} />);

      // Check if video element exists
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('autoPlay');
      expect(video).toHaveAttribute('loop');
    });
  });

  // NAVIGATION
  describe('Navigation', () => {
    test('should navigate to login when Login button in nav is clicked', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      const loginButtons = screen.getAllByRole('button', { name: /login/i });
      fireEvent.click(loginButtons[0]); // Click nav Login button

      expect(mockOnNavigate).toHaveBeenCalledWith('login');
    });

    test('should navigate to login when Get Started button is clicked', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      fireEvent.click(getStartedButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('login');
    });

    test('should navigate to home when Home button is clicked', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      const homeButton = screen.getByRole('button', { name: /home/i });
      fireEvent.click(homeButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });
  });

  // UI/UX ELEMENTS
  describe('UI/UX Elements', () => {
    test('should display main heading with correct text', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      const headings = screen.getAllByText('Smartwalls');
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should display tagline', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      expect(screen.getByText("Tennet's assembly and building management")).toBeInTheDocument();
    });

    test('should have proper button styling classes', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      expect(getStartedButton).toHaveStyle({ background: '#27ae60' });
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    test('should handle multiple navigation clicks', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      const loginButton = screen.getAllByRole('button', { name: /login/i })[0];

      fireEvent.click(loginButton);
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);

      expect(mockOnNavigate).toHaveBeenCalledTimes(3);
      expect(mockOnNavigate).toHaveBeenCalledWith('login');
    });

    test('should render without crashing when onNavigate is not provided', () => {
      // This should not crash, but won't be able to navigate
      expect(() => render(<Home />)).not.toThrow();
    });
  });

  // ACCESSIBILITY
  describe('Accessibility', () => {
    test('should have buttons with proper roles', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have readable button text', () => {
      render(<Home onNavigate={mockOnNavigate} />);

      expect(screen.getByRole('button', { name: /get started/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /home/i })).toHaveAccessibleName();
      expect(screen.getAllByRole('button', { name: /login/i })[0]).toHaveAccessibleName();
    });
  });

  // VIDEO BACKGROUND
  describe('Video Background', () => {
    test('should have video with correct attributes', () => {
      const { container } = render(<Home onNavigate={mockOnNavigate} />);

      const video = container.querySelector('video');
      expect(video).toHaveAttribute('autoPlay');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveAttribute('playsInline');
    });

    test('should have video source pointing to building-video', () => {
      const { container } = render(<Home onNavigate={mockOnNavigate} />);

      const source = container.querySelector('video source');
      expect(source).toHaveAttribute('src', '/building-video.mp4');
      expect(source).toHaveAttribute('type', 'video/mp4');
    });

    test('should have overlay for text readability', () => {
      const { container } = render(<Home onNavigate={mockOnNavigate} />);

      // Check for overlay div with dark background
      const overlays = container.querySelectorAll('div[style*="rgba(0, 0, 0"]');
      expect(overlays.length).toBeGreaterThan(0);
    });
  });
});
