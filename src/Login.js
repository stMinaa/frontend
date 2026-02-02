import React, { useState } from 'react';
import VideoBackground from './components/VideoBackground';

function Login({ onLogin, onNavigate }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Korisničko ime i lozinka su obavezni');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Prijava neuspešna');
        return;
      }

      // Phase 2: Only save token, not user object
      // User object will be managed by App component state
      onLogin(data.token, data.user);
    } catch (err) {
      setError('Greška prilikom konekcije. Da li backend radi na portu 5000?');
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
            Početna
          </button>
        </div>
      </div>

      {/* Login Card */}
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
          backdropFilter: 'blur(10px)',
          width: '100%',
          maxWidth: 400
        }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: 30,
            fontSize: 28,
            color: '#2c3e50'
          }}>
            Prijava
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Korisničko ime ili Email"
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

            <div style={{ marginBottom: 25 }}>
              <input
                type="password"
                placeholder="Lozinka"
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
              {loading ? 'Prijavljujem...' : 'Prijavi se'}
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

            <div style={{
              marginTop: 20,
              textAlign: 'center',
              fontSize: 15,
              color: '#7f8c8d'
            }}>
              Nemate nalog?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
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
                Registruj se
              </button>
            </div>
          </form>
        </div>
      </div>
    </VideoBackground>
  );
}

export default Login;
