import React, { useState } from 'react';

function TenantProfile({ user, token, onUserUpdate }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTitle, setPaymentTitle] = useState('');
  const [paymentReason, setPaymentReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [debt, setDebt] = useState(user?.debt || 0);

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || user?.username || 'Korisnik';

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!firstName.trim()) { setError('Ime je obavezno.'); return; }
    if (!lastName.trim()) { setError('Prezime je obavezno.'); return; }
    if (mobile && !/^\d{7,15}$/.test(mobile)) { setError('Broj telefona mora imati 7-15 cifara.'); return; }
    
    // Get token from prop or fallback to localStorage
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setError('Niste prijavljeni. Molimo prijavite se ponovo.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Updating profile with:', { firstName, lastName, mobile });
      console.log('Token:', authToken ? 'present (length: ' + authToken.length + ')' : 'missing');
      const res = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
        body: JSON.stringify({ firstName, lastName, mobile })
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      if (res.ok) {
        setSuccess('Profil ažuriran!');
        // Keep the updated values in state (don't reset to old user prop)
        // The state already has firstName, lastName, mobile from the form
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          // Update component state with confirmed values from server
          setFirstName(data.user.firstName || '');
          setLastName(data.user.lastName || '');
          setMobile(data.user.mobile || '');
          // Notify parent to update user object everywhere
          if (onUserUpdate) onUserUpdate(data.user);
        }
        setEditing(false);
      } else {
        console.error('Update failed:', data);
        setError(data.message || 'Greška pri ažuriranju.');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Greška pri ažuriranju.');
    }
    setLoading(false);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    if (!paymentTitle.trim() || !paymentReason.trim() || !paymentAmount) {
      setPaymentError('Sva polja su obavezna.');
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Unesite validnu vrednost.');
      return;
    }
    if (amount > debt) {
      setPaymentError('Iznos ne može biti veći od duga.');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/pay-debt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        setDebt(data.remainingDebt || 0);
        setShowPaymentModal(false);
        setPaymentTitle('');
        setPaymentReason('');
        setPaymentAmount('');
        setSuccess('Uplata uspešna!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setPaymentError(data.message || 'Greška pri uplati.');
      }
    } catch (err) {
      setPaymentError('Greška pri uplati.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        width: 220,
        background: '#1fc08f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        color: 'white'
      }}>
        <img 
          src="/tenant-avatar.png" 
          alt="Tenant avatar"
          style={{ width: 170, height: 170, borderRadius: 12, marginBottom: 20, objectFit: 'cover', imageRendering: '-webkit-optimize-contrast' }}
        />
        <div style={{ fontSize: 14, marginBottom: 8, opacity: 0.9 }}>Stanar</div>
        <div style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 }}>
          {fullName}
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            padding: '12px 24px',
            background: '#147346',
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

      <div style={{ flex: 1, padding: 0, background: '#f8f9fa' }}>
        <h2 style={{ fontSize: 28, fontWeight: 300, letterSpacing: 4, margin: '40px 0 40px 40px', color: '#2c3e50', textAlign: 'left' }}>
          INFORMACIJE
        </h2>

        {editing ? (
          <form onSubmit={handleUpdate} style={{ marginLeft: 40 }}>
            {success && <div style={{ padding: 12, background: '#d4edda', color: '#155724', borderRadius: 6, marginBottom: 20, maxWidth: 800 }}>{success}</div>}
            {error && <div style={{ padding: 12, background: '#f8d7da', color: '#721c24', borderRadius: 6, marginBottom: 20, maxWidth: 800 }}>{error}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, maxWidth: 800 }}>
              <div>
                <label style={{ display: 'block', fontSize: 16, color: '#2c3e50', marginBottom: 8 }}>Ime</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 16, color: '#2c3e50', marginBottom: 8 }}>Prezime</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 16, color: '#2c3e50', marginBottom: 8 }}>Broj telefona</label>
                <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
              </div>
            </div>
            <div style={{ marginTop: 30 }}>
              <button type="submit" disabled={loading} style={{ padding: '12px 30px', background: '#147346', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 10, fontSize: 14 }}>
                {loading ? 'Čuvanje...' : 'Sačuvaj'}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{ padding: '12px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                Otkaži
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px 60px', maxWidth: 800, marginBottom: 50, marginLeft: 40 }}>
              <div>
                <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Korisničko ime</div>
                <div style={{ fontSize: 16, color: '#95a5a6' }}>anja@smartwalls</div>
              </div>
              <div>
                <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Zgrada</div>
                <div style={{ fontSize: 16, color: '#95a5a6' }}>Sremska 4</div>
              </div>
              <div>
                <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Broj stana</div>
                <div style={{ fontSize: 16, color: '#95a5a6' }}>1</div>
              </div>
              <div>
                <div style={{ fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: 500 }}>Broj ukucana</div>
                <div style={{ fontSize: 16, color: '#95a5a6' }}>8</div>
              </div>
            </div>

            <div style={{ marginLeft: 40 }}>
              <h3 style={{ fontSize: 24, fontWeight: 300, letterSpacing: 3, marginBottom: 20, color: '#2c3e50', textAlign: 'left' }}>DUGOVANJA</h3>
              {success && <div style={{ padding: 12, background: '#d4edda', color: '#155724', borderRadius: 6, marginBottom: 20, maxWidth: 500 }}>{success}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ fontSize: 18, color: '#7f8c8d', marginRight: -10 }}>Dugovanja:</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#2c3e50' }}>{debt} RSD</div>
                <button onClick={() => setShowPaymentModal(true)} style={{ padding: '10px 30px', background: '#147346', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 500 }}>
                  Plati
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 30,
            borderRadius: 8,
            width: '90%',
            maxWidth: 500
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: '#2c3e50' }}>Uplata</h3>
            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#2c3e50' }}>Naslov</label>
                <input
                  type="text"
                  value={paymentTitle}
                  onChange={(e) => setPaymentTitle(e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                  placeholder="npr. Mesečna rata"
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#2c3e50' }}>Razlog</label>
                <input
                  type="text"
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                  placeholder="npr. Rezije za januar"
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#2c3e50' }}>Vrednost (RSD)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              {paymentError && <div style={{ color: '#e74c3c', fontSize: 14, marginBottom: 15 }}>{paymentError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowPaymentModal(false); setPaymentError(''); }} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Otkaži
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#147346', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Potvrdi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantProfile;
