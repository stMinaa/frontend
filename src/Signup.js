/* eslint-disable max-lines-per-function, complexity, max-lines */
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
      setError('Korisničko ime, email i lozinka su obavezni');
      return;
    }

    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Neispravan format email-a');
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
        setError(data.message || 'Registracija neuspešna');
        return;
      }

      setSuccess('Nalog kreiran! Upravnik će vam dodeliti zgradu i stan nakon odobrenja. Preusmeravam na prijavu...');

      // Phase 2: Don't save anything to localStorage on signup
      // User must login after account creation

      // Redirect to login after 2 seconds
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
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
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '15px 40px',
        background: '#2c3e50',
        zIndex: 100,
        gap: 30
      }}>
        <button
          onClick={() => onNavigate('home')}
          style={{
            padding: '0',
            background: 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 400
          }}
        >
          Home
        </button>
        <button
          onClick={() => onNavigate('login')}
          style={{
            padding: '0',
            background: 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 400
          }}
        >
          Login
        </button>
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
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '40px 50px',
          borderRadius: 12,
          backdropFilter: 'blur(10px)',
          width: '100%',
          maxWidth: 450
        }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: 30,
            fontSize: 28,
            color: '#fff'
          }}>
            Registracija
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 15 }}>
              <input
                type="text"
                placeholder="Korisničko ime"
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
                placeholder="Ime (opciono)"
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
                placeholder="Prezime (opciono)"
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
                Izaberite ulogu:
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
                <option value="tenant">Stanar</option>
                <option value="manager">Upravnik</option>
                <option value="director">Šef</option>
                <option value="associate">Servis</option>
              </select>
              <small style={{ fontSize: 13, color: '#7f8c8d', display: 'block', marginTop: 5 }}>
                Vaš nalog zahteva odobrenje na osnovu izabrane uloge.
              </small>
            </div>

            <div style={{ marginBottom: 20 }}>
              <input
                type="password"
                placeholder="Lozinka (minimum 6 karaktera)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
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
                background: loading ? '#95a5a6' : '#198653',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 17,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = '#146b42')}
              onMouseOut={(e) => !loading && (e.target.style.background = '#198653')}
            >
              {loading ? 'Kreiram nalog...' : 'Registruj se'}
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
                color: '#198653',
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
              color: '#ddd'
            }}>
              Već imate nalog?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1fc08f',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 15,
                  fontWeight: 500
                }}
              >
                Prijavi se
              </button>
            </div>
          </form>
        </div>
      </div>
    </VideoBackground>
  );
}

export default Signup;
