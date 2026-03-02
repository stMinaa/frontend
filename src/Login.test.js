/* eslint-disable max-nested-callbacks */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './Login';

// Mock VideoBackground to prevent jsdom video errors
jest.mock('./components/VideoBackground', () => {
  return function MockVideoBackground({ children }) {
    return <div data-testid="video-background">{children}</div>;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('Login Component', () => {
  const mockOnLogin = jest.fn();
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  // SUCCESS SCENARIOS
  describe('Success Scenarios', () => {
    test('should render login form with all required elements', () => {
      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      expect(screen.getByPlaceholderText('anja@smartwalls')).toBeInTheDocument();
      expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByText(/nemate nalog/i)).toBeInTheDocument();
    });

    test('should successfully login with valid credentials', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'tenant',
        status: 'active'
      };
      const mockToken = 'mock-jwt-token';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: mockToken, user: mockUser } })
      });

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const usernameInput = screen.getByPlaceholderText('anja@smartwalls');
      const passwordInput = container.querySelector('input[type="password"]');
      const loginButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' })
        });
      });

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith(mockToken, mockUser);
      });
    });

    test('should login with email instead of username', async () => {
      const mockUser = { username: 'testuser', email: 'test@example.com', role: 'manager', status: 'active' };
      const mockToken = 'token123';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: mockToken, user: mockUser } })
      });

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'test@example.com' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith(mockToken, mockUser);
      });
    });
  });

  // INVALID INPUT SCENARIOS
  describe('Invalid Input Scenarios', () => {
    test('should show error when username is empty', async () => {
      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const passwordInput = container.querySelector('input[type="password"]');
      const loginButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Korisničko ime i lozinka su obavezni')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('should show error when password is empty', async () => {
      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const usernameInput = screen.getByPlaceholderText('anja@smartwalls');
      const loginButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Korisničko ime i lozinka su obavezni')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error when both fields are empty', async () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Korisničko ime i lozinka su obavezni')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error with invalid credentials from backend', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' })
      });

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'wronguser' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'wrongpass' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    test('should trim whitespace from username', async () => {
      const mockUser = { username: 'testuser', role: 'tenant', status: 'active' };
      const mockToken = 'token';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: mockToken, user: mockUser } })
      });

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: '  testuser  ' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'pass123' })
        });
      });
    });

    test('should handle network error gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'testuser' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText(/Greška.*konekcije/i)).toBeInTheDocument();
      });
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('should disable form while loading', async () => {
      fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'test' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /prijavljivanje/i })).toBeDisabled();
        expect(screen.getByPlaceholderText('anja@smartwalls')).toBeDisabled();
        expect(container.querySelector('input[type="password"]')).toBeDisabled();
      });
    });

    test('should handle whitespace-only inputs as empty', async () => {
      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: '   ' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: '   ' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Korisničko ime i lozinka su obavezni')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  // NAVIGATION
  describe('Navigation', () => {
    test('should navigate to signup when Registruj se is clicked', () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const signupButton = screen.getByText('Registruj se');
      fireEvent.click(signupButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('signup');
    });

    test('should navigate to home when Home button is clicked', () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const homeButton = screen.getByRole('button', { name: /home/i });
      fireEvent.click(homeButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });
  });

  // SECURITY
  describe('Security', () => {
    test('should not expose password in error messages', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'test' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'secretpassword' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/Greška.*konekcije/i);
        expect(errorMessage.textContent).not.toContain('secretpassword');
      });
    });

    test('should use password input type for password field', () => {
      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const passwordInput = container.querySelector('input[type="password"]');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // BACKEND INTEGRATION
  describe('Backend Integration', () => {
    test('should send POST request to correct endpoint', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'token', user: { username: 'test' } } })
      });

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'test' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:5000/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    test('should handle 500 server error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' })
      });

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'test' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });
    });

    test('should handle missing error message from backend', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      const { container } = render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('anja@smartwalls'), { target: { value: 'test' } });
      fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Prijava neuspešna')).toBeInTheDocument();
      });
    });
  });
});
