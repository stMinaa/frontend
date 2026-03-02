/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import Signup from './Signup';

// Mock fetch
global.fetch = jest.fn();

describe('Signup Component', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SUCCESS SCENARIOS
  describe('Success Scenarios', () => {
    test('should render signup form with all required elements', () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select your role/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    test('should successfully signup with required fields only (tenant)', async () => {
      const mockUser = {
        _id: '123',
        username: 'newuser',
        email: 'new@example.com',
        role: 'tenant',
        status: 'pending'
      };
      const mockToken = 'token123';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken, user: mockUser })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'newuser' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
            firstName: undefined,
            lastName: undefined,
            role: 'tenant'
          })
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/account created/i)).toBeInTheDocument();
        expect(screen.getByText(/requires manager approval/i)).toBeInTheDocument();
      });
    });

    test('should signup with all fields including optional ones', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { username: 'john' } })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'john' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/select your role/i), { target: { value: 'manager' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'secure123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'john',
            email: 'john@test.com',
            password: 'secure123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'manager'
          })
        });
      });
    });

    test('should redirect to login after successful signup', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { username: 'test' } })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/account created/i)).toBeInTheDocument();
      });

      // Fast-forward timer by 2 seconds
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('login');
      });
    });

    test('should signup with each role type', async () => {
      const roles = ['tenant', 'manager', 'director', 'associate'];

      for (const role of roles) {
        jest.clearAllMocks();
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'token', user: { username: 'test', role } })
        });

        const { unmount } = render(<Signup onNavigate={mockOnNavigate} />);

        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/select your role/i), { target: { value: role } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith(
            'http://localhost:5000/api/auth/signup',
            expect.objectContaining({
              body: expect.stringContaining(`"role":"${role}"`)
            })
          );
        });

        unmount();
      }
    });
  });

  // INVALID INPUT SCENARIOS
  describe('Invalid Input Scenarios', () => {
    test('should show error when username is missing', async () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/username, email, and password are required/i)).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error when email is missing', async () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/username, email, and password are required/i)).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error when password is missing', async () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/username, email, and password are required/i)).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error for password less than 6 characters', async () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'abc' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error for invalid email format', async () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid-email' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should show error when username already exists', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Username already exists' })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'existing' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText('Username already exists')).toBeInTheDocument();
      });
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    test('should trim whitespace from inputs', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { username: 'test' } })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: '  test  ' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: '  test@test.com  ' } });
      fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: '  John  ' } });
      fireEvent.change(screen.getByPlaceholderText(/last name/i), { target: { value: '  Doe  ' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'test',
            email: 'test@test.com',
            password: 'pass123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'tenant'
          })
        });
      });
    });

    test('should handle whitespace-only optional fields as undefined', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { username: 'test' } })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByPlaceholderText(/last name/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.firstName).toBeUndefined();
        expect(body.lastName).toBeUndefined();
      });
    });

    test('should handle network error gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      });
    });

    test('should disable form while loading', async () => {
      fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
        expect(screen.getByPlaceholderText('Username')).toBeDisabled();
        expect(screen.getByPlaceholderText('Email')).toBeDisabled();
      });
    });

    test('should validate email with various formats', async () => {
      const invalidEmails = ['test', 'test@', '@test.com', 'test@test', 'test test@test.com'];

      for (const email of invalidEmails) {
        jest.clearAllMocks();
        const { unmount } = render(<Signup onNavigate={mockOnNavigate} />);

        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: email } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => {
          expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
        });
        expect(fetch).not.toHaveBeenCalled();

        unmount();
      }
    });

    test('should default to tenant role', () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      const roleSelect = screen.getByLabelText(/select your role/i);
      expect(roleSelect.value).toBe('tenant');
    });
  });

  // NAVIGATION
  describe('Navigation', () => {
    test('should navigate to login when Login button is clicked', () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      // Click the Login button in the form footer (not the nav)
      const loginButtons = screen.getAllByText('Login');
      fireEvent.click(loginButtons[loginButtons.length - 1]);

      expect(mockOnNavigate).toHaveBeenCalledWith('login');
    });

    test('should navigate to home when Home button is clicked', () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      const homeButton = screen.getByRole('button', { name: /home/i });
      fireEvent.click(homeButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });

    test('should navigate to home when Smartwalls logo is clicked', () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      const logo = screen.getByText('Smartwalls');
      fireEvent.click(logo);

      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });
  });

  // SECURITY
  describe('Security', () => {
    test('should use password input type', () => {
      render(<Signup onNavigate={mockOnNavigate} />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should not expose password in error messages', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'secretpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/connection error/i);
        expect(errorMessage.textContent).not.toContain('secretpassword123');
      });
    });
  });

  // BACKEND INTEGRATION
  describe('Backend Integration', () => {
    test('should send POST request to correct endpoint', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { username: 'test' } })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:5000/api/auth/signup',
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

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });
    });

    test('should handle missing error message from backend', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText('Signup failed')).toBeInTheDocument();
      });
    });

    test('should display approval requirement message in success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { username: 'test' } })
      });

      render(<Signup onNavigate={mockOnNavigate} />);

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/requires manager approval/i)).toBeInTheDocument();
      });
    });
  });
});
