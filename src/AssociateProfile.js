import React, { useState } from 'react';

function AssociateProfile({ user, token }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Vanja Stanković';

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!firstName.trim()) { setError('Ime je obavezno.'); return; }
    if (!lastName.trim()) { setError('Prezime je obavezno.'); return; }
    if (mobile && !/^\d{7,15}$/.test(mobile)) { setError('Broj telefona mora imati 7-15 cifara.'); return; }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ firstName, lastName, mobile })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Profil ažuriran!');
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        setEditing(false);
      } else {
        setError(data.message || 'Greška pri ažuriranju.');
      }
    } catch (err) {
      setError('Greška pri ažuriranju.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Left sidebar - Blue gradient */}
      <div style={{
        width: 220,
        background: 'linear-gradient(180deg, #4A90E2 0%, #7CB8F7 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        color: 'white'
      }}>
        <img
          src="/associate-avatar.png"
          alt="Associate avatar"
          style={{ width: 170, height: 170, borderRadius: 12, marginBottom: 20, objectFit: 'cover', imageRendering: '-webkit-optimize-contrast' }}
        />
        <div style={{ fontSize: 14, marginBottom: 8, opacity: 0.9 }}>Saradnik</div>
        <div style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 }}>
          {fullName}
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Izmeni podatke
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 0, background: '#f8f9fa' }}>
        <h2 style={{ fontSize: 28, fontWeight: 300, letterSpacing: 4, margin: '40px 0 40px 40px', color: '#2c3e50' }}>
          ELEKTRO VANJA
        </h2>

        {success && <div style={{ padding: 12, background: '#d4edda', color: '#155724', borderRadius: 6, marginBottom: 20 }}>{success}</div>}
        {error && <div style={{ padding: 12, background: '#f8d7da', color: '#721c24', borderRadius: 6, marginBottom: 20 }}>{error}</div>}

        {editing ? (
          <form onSubmit={handleUpdate} style={{ marginLeft: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, maxWidth: 800 }}>
              <div>
                <label style={{ display: 'block', fontSize: 16, color: '#2c3e50', marginBottom: 8 }}>Ime</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 16, color: '#2c3e50', marginBottom: 8 }}>Prezime</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 16, color: '#2c3e50', marginBottom: 8 }}>Broj telefona</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}
                />
              </div>
            </div>
            <div style={{ marginTop: 30 }}>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '12px 30px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 10, fontSize: 14 }}
              >
                {loading ? 'Čuvanje...' : 'Sačuvaj'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{ padding: '12px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
              >
                Otkaži
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px 60px', maxWidth: 800, marginLeft: 40 }}>
            <div>
              <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Ime</div>
              <div style={{ fontSize: 16, color: '#95a5a6' }}>{firstName || 'Vanja'}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Prezime</div>
              <div style={{ fontSize: 16, color: '#95a5a6' }}>{lastName || 'Stanković'}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Email</div>
              <div style={{ fontSize: 16, color: '#95a5a6' }}>{user?.email || 'stvanja@gmail.com'}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Broj telefona</div>
              <div style={{ fontSize: 16, color: '#95a5a6' }}>{mobile || '3814569875'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssociateProfile;
