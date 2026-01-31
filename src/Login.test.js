import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './Login';

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
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username or Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
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
        json: async () => ({ token: mockToken, user: mockUser })
      });

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const usernameInput = screen.getByPlaceholderText('Username or Email');
      const passwordInput = screen.getByPlaceholderText('Password');
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
        json: async () => ({ token: mockToken, user: mockUser })
      });

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith(mockToken, mockUser);
      });
    });
  });

  // INVALID INPUT SCENARIOS
  describe('Invalid Input Scenarios', () => {
    test('should show error when username is empty', async () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Username and password are required')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('should show error when password is empty', async () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const usernameInput = screen.getByPlaceholderText('Username or Email');
      const loginButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Username and password are required')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error when both fields are empty', async () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Username and password are required')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error with invalid credentials from backend', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' })
      });

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'wronguser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });
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
        json: async () => ({ token: mockToken, user: mockUser })
      });

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: '  testuser  ' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
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

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      });
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('should disable form while loading', async () => {
      fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
        expect(screen.getByPlaceholderText('Username or Email')).toBeDisabled();
        expect(screen.getByPlaceholderText('Password')).toBeDisabled();
      });
    });

    test('should handle whitespace-only inputs as empty', async () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: '   ' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '   ' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Username and password are required')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  // NAVIGATION
  describe('Navigation', () => {
    test('should navigate to signup when Sign Up is clicked', () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const signupButton = screen.getByText('Sign Up');
      fireEvent.click(signupButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('signup');
    });

    test('should navigate to home when Home button is clicked', () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const homeButton = screen.getByRole('button', { name: /home/i });
      fireEvent.click(homeButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });

    test('should navigate to home when Smartwalls logo is clicked', () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const logo = screen.getByText('Smartwalls');
      fireEvent.click(logo);

      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });
  });

  // SECURITY
  describe('Security', () => {
    test('should not expose password in error messages', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secretpassword' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/connection error/i);
        expect(errorMessage.textContent).not.toContain('secretpassword');
      });
    });

    test('should use password input type for password field', () => {
      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      const passwordInput = screen.getByPlaceholderText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // BACKEND INTEGRATION
  describe('Backend Integration', () => {
    test('should send POST request to correct endpoint', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { username: 'test' } })
      });

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass' } });
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

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass' } });
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

      render(<Login onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });
  });
});
