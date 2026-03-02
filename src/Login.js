import React, { useState } from 'react';

import VideoBackground from './components/VideoBackground';

const NAV_STYLE = { position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '15px 40px', background: '#2c3e50', zIndex: 100, gap: 30 };
const NAV_BTN_STYLE = { padding: 0, background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 400 };
const WRAPPER_STYLE = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' };
const CARD_STYLE = { background: 'rgba(0, 0, 0, 0.5)', padding: '40px 50px', borderRadius: 12, backdropFilter: 'blur(10px)', width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' };
const LABEL_STYLE = { display: 'block', marginBottom: 8, fontSize: 14, color: '#fff', fontWeight: 400 };
const INPUT_STYLE = { width: '100%', padding: '12px 15px', borderRadius: 6, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', background: '#f8f9fa' };
const SIGNUP_BTN_STYLE = { background: 'none', border: 'none', color: '#1fc08f', cursor: 'pointer', textDecoration: 'underline', fontSize: 15, fontWeight: 500 };
const ERROR_STYLE = { color: '#e74c3c', marginTop: 15, fontSize: 14, textAlign: 'center' };

function LoginNavBar({ onNavigate }) {
  return (
    <div style={NAV_STYLE}>
      <button onClick={() => onNavigate('home')} style={NAV_BTN_STYLE}>Home</button>
      <button onClick={() => onNavigate('login')} style={NAV_BTN_STYLE}>Login</button>
    </div>
  );
}

function LoginFormFields({ username, password, loading, onUsernameChange, onPasswordChange }) {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL_STYLE}>Username</label>
        <input
          type="text"
          placeholder="anja@smartwalls"
          value={username}
          onChange={e => onUsernameChange(e.target.value)}
          disabled={loading}
          style={INPUT_STYLE}
        />
      </div>
      <div style={{ marginBottom: 25 }}>
        <label style={LABEL_STYLE}>Password</label>
        <input
          type="password"
          placeholder=""
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          disabled={loading}
          autoComplete="new-password"
          style={INPUT_STYLE}
        />
      </div>
    </>
  );
}

function LoginCard({ username, password, loading, error, onUsernameChange, onPasswordChange, onSubmit, onNavigate }) {
  const btnBg = loading ? '#95a5a6' : '#198653';
  return (
    <div style={WRAPPER_STYLE}>
      <div style={CARD_STYLE}>
        <form onSubmit={onSubmit}>
          <LoginFormFields
            username={username}
            password={password}
            loading={loading}
            onUsernameChange={onUsernameChange}
            onPasswordChange={onPasswordChange}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: btnBg, color: 'white', border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}
            onMouseOver={e => { if (!loading) e.target.style.background = '#146b42'; }}
            onMouseOut={e => { if (!loading) e.target.style.background = '#198653'; }}
          >
            {loading ? 'Prijavljivanje...' : 'Log In'}
          </button>
          {error && <div style={ERROR_STYLE}>{error}</div>}
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 15, color: '#ddd' }}>
            Nemate nalog?{' '}
            <button type="button" onClick={() => onNavigate('signup')} disabled={loading} style={SIGNUP_BTN_STYLE}>
              Registruj se
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Login({ onLogin, onNavigate }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) { setError('Korisničko ime i lozinka su obavezni'); return; }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || 'Prijava neuspešna'); return; }
      onLogin(data.data.token, data.data.user);
    } catch (err) {
      setError('Greška prilikom konekcije. Da li backend radi na portu 5000?');
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <VideoBackground videoSrc="/building-video.mp4">
      <LoginNavBar onNavigate={onNavigate} />
      <LoginCard
        username={username}
        password={password}
        loading={loading}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        onNavigate={onNavigate}
      />
    </VideoBackground>
  );
}

export default Login;
