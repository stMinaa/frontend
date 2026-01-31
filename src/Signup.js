import React, { useState } from 'react';
import VideoBackground from './components/VideoBackground';

function Signup({ onNavigate }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('tenant'); // Phase 2: Add role selection
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Username, email, and password are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Invalid email format');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          role: role // Phase 2: Include role in signup
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      setSuccess('Account created! Your account requires manager approval. Redirecting to login...');
      
      // Phase 2: Don't save anything to localStorage on signup
      // User must login after account creation

      // Redirect to login after 2 seconds
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    } catch (err) {
      setError('Connection error. Is the backend running on port 5000?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VideoBackground videoSrc="/building-video.mp4">
      {/* Top Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(5px)',
        zIndex: 100
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          letterSpacing: '1px',
          cursor: 'pointer'
        }}
        onClick={() => onNavigate('home')}
        >
          Smartwalls
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              padding: '10px 25px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid white',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('login')}
            style={{
              padding: '10px 25px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            Login
          </button>
        </div>
      </div>

      {/* Signup Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px 50px',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: 450
        }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: 30,
            fontSize: 28,
            color: '#2c3e50'
          }}>
            Sign Up
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 15 }}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <input
                type="text"
                placeholder="First Name (optional)"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <input
                type="text"
                placeholder="Last Name (optional)"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Phase 2: Role selection dropdown */}
            <div style={{ marginBottom: 15 }}>
              <label htmlFor="role-select" style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500, color: '#2c3e50' }}>
                Select Your Role:
              </label>
              <select
                id="role-select"
                value={role}
                onChange={e => setRole(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 15,
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                <option value="tenant">Tenant</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
                <option value="associate">Associate</option>
              </select>
              <small style={{ fontSize: 13, color: '#7f8c8d', display: 'block', marginTop: 5 }}>
                Your account will require approval based on your selected role.
              </small>
            </div>

            <div style={{ marginBottom: 20 }}>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#95a5a6' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 17,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = '#229954')}
              onMouseOut={(e) => !loading && (e.target.style.background = '#27ae60')}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            {error && (
              <div style={{
                color: '#e74c3c',
                marginTop: 15,
                fontSize: 14,
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{
                color: '#27ae60',
                marginTop: 15,
                fontSize: 14,
                textAlign: 'center',
                fontWeight: 500
              }}>
                {success}
              </div>
            )}

            <div style={{
              marginTop: 20,
              textAlign: 'center',
              fontSize: 15,
              color: '#7f8c8d'
            }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#27ae60',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 15,
                  fontWeight: 500
                }}
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </VideoBackground>
  );
}

export default Signup;
