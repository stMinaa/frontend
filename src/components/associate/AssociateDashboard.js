/* eslint-disable max-lines, max-lines-per-function, complexity, no-console */
import React, { useEffect, useState } from 'react';

import AssociateProfile from './AssociateProfile';

function AssociateDashboard({ user, activeTab }) {
  const token = localStorage.getItem('token');
  const tab = activeTab === 'profile' ? 'profile' : 'kvarovi';
  const [issues, setIssues] = useState([]);
  const [costMap, setCostMap] = useState({});
  const [notesMap, setNotesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/associates/me/jobs`, { 
        headers: { 'Authorization': 'Bearer ' + token } 
      });
      const data = await res.json();
      console.log('Associate jobs response:', data);
      if (res.ok && Array.isArray(data.data)) {
        setIssues(data.data);
      } else {
        setError(data.message || 'Greška pri učitavanju poslova');
      }
    } catch (err) {
      console.error('Load issues error:', err);
      setError('Greška pri učitavanju poslova');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === 'kvarovi') {
      loadIssues();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const acceptJob = async (issueId) => {
    const cost = costMap[issueId];
    if (!cost || cost <= 0) {
      setError('Unesite procenjenu cenu');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/issues/${issueId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ estimatedCost: Number(cost) })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Posao prihvaćen! Možete nastaviti sa radom.');
        setCostMap(prev => ({ ...prev, [issueId]: '' }));
        setTimeout(() => setSuccess(''), 3000);
        loadIssues();
      } else {
        setError(data.message || 'Prihvatanje posla neuspelo');
      }
    } catch (err) {
      console.error('Accept job error:', err);
      setError('Prihvatanje posla neuspelo');
    } finally {
      setLoading(false);
    }
  };

  const rejectJob = async (issueId) => {
    if (!window.confirm('Da li ste sigurni da želite da odbijete ovaj posao?')) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/issues/${issueId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ reason: 'Declined by associate' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Posao odbijen');
        setTimeout(() => setSuccess(''), 3000);
        loadIssues();
      } else {
        setError(data.message || 'Odbijanje posla neuspelo');
      }
    } catch (err) {
      console.error('Reject job error:', err);
      setError('Odbijanje posla neuspelo');
    } finally {
      setLoading(false);
    }
  };

  const completeJob = async (issueId) => {
    const notes = notesMap[issueId];
    if (!notes || !notes.trim()) {
      setError('Unesite napomene o završetku');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/issues/${issueId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ completionNotes: notes })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Posao završen! Kreirana je faktura za direktora.');
        setNotesMap(prev => ({ ...prev, [issueId]: '' }));
        setTimeout(() => setSuccess(''), 3000);
        loadIssues();
      } else {
        setError(data.message || 'Završavanje posla neuspelo');
      }
    } catch (err) {
      console.error('Complete job error:', err);
      setError('Završavanje posla neuspelo');
    } finally {
      setLoading(false);
    }
  };

  // Filter issues based on priority, status and search
  const filteredIssues = issues.filter(issue => {
    // Priority filter
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    
    // Status filter
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        issue.title?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.building?.name?.toLowerCase().includes(query) ||
        issue.createdBy?.firstName?.toLowerCase().includes(query) ||
        issue.createdBy?.lastName?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  if (tab === 'profile') return <AssociateProfile user={user} />;

  return (
    <div style={{ padding: 40, maxWidth: 1400, margin: '0 auto' }}>
      {error && (
        <div style={{ padding: 16, background: '#fee2e2', color: '#c0392b', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #f5c6cb' }}>
          <span style={{ fontWeight: 600 }}>✕</span> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 16, background: '#d4edda', color: '#27ae60', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #c3e6cb' }}>
          <span style={{ fontWeight: 600 }}>✓</span> {success}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#2c3e50' }}>
            Dodeljeni kvarovi
          </h1>
          <p style={{ color: '#7f8c8d', margin: '5px 0 0 0', fontSize: 16 }}>
            Upravljajte vašim servisnim zadacima
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 30, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pretraži po opisu, zgradi, stanaru..."
          style={{
            flex: 1,
            minWidth: 300,
            padding: '12px 16px',
            fontSize: 15,
            border: '1px solid #dee2e6',
            borderRadius: 6,
            boxSizing: 'border-box'
          }}
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #dee2e6',
            borderRadius: 6,
            fontSize: 14,
            background: 'white',
            color: '#2c3e50',
            cursor: 'pointer',
            minWidth: 150
          }}
        >
          <option value="all">Svi prioriteti</option>
          <option value="high">Visok</option>
          <option value="medium">Srednji</option>
          <option value="low">Nizak</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #dee2e6',
            borderRadius: 6,
            fontSize: 14,
            background: 'white',
            color: '#2c3e50',
            cursor: 'pointer',
            minWidth: 150
          }}
        >
          <option value="all">Svi statusi</option>
          <option value="assigned">Dodeljen</option>
          <option value="in-progress">U toku</option>
          <option value="resolved">Završen</option>
        </select>
      </div>

      {/* Issues List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ color: '#95a5a6', fontSize: 16 }}>Učitavanje kvarova...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 80,
          background: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: 8, fontSize: 18 }}>
            {issues.length === 0 ? 'Nema dodeljenih kvarova' : 'Nema kvarova sa izabranim filterima'}
          </h3>
          <p style={{ color: '#7f8c8d', fontSize: 14 }}>
            {issues.length === 0 
              ? 'Kvarovi će se pojaviti ovde nakon što vam ih direktor dodeli'
              : 'Promenite filtere da vidite druge kvarove'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredIssues.map(issue => {
            const isAssigned = issue.status === 'assigned';
            const isInProgress = issue.status === 'in-progress';
            const isResolved = issue.status === 'resolved';

            return (
              <div key={issue._id} style={{
                background: 'white',
                borderRadius: 8,
                border: '1px solid #dee2e6',
                overflow: 'hidden'
              }}>
                {/* Issue Header */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px 24px',
                  borderBottom: '1px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 20
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#2c3e50' }}>
                        {issue.title}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        background: issue.priority === 'high' ? '#fee2e2' : issue.priority === 'medium' ? '#fff3cd' : '#e8f5e9',
                        color: issue.priority === 'high' ? '#c0392b' : issue.priority === 'medium' ? '#e67e22' : '#27ae60',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {issue.priority === 'high' ? 'Visok' : issue.priority === 'medium' ? 'Srednji' : 'Nizak'}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        background: isResolved ? '#d4edda' : isInProgress ? '#fff3cd' : isAssigned ? '#cfe2ff' : '#f8f9fa',
                        color: isResolved ? '#27ae60' : isInProgress ? '#e67e22' : isAssigned ? '#3498db' : '#7f8c8d',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {isAssigned ? 'Dodeljen' : isInProgress ? 'U toku' : isResolved ? 'Završen' : 'Nepoznato'}
                      </span>
                    </div>
                    <div style={{ color: '#7f8c8d', fontSize: 14 }}>
                      <span>Zgrada: {issue.building?.name || 'N/A'}</span>
                      <span style={{ margin: '0 12px' }}>•</span>
                      <span>Stan {issue.apartment?.number || 'N/A'}</span>
                      <span style={{ margin: '0 12px' }}>•</span>
                      <span>Prijavio: {issue.createdBy?.firstName} {issue.createdBy?.lastName}</span>
                    </div>
                  </div>
                  {issue.estimatedCost && (
                    <div style={{
                      textAlign: 'right',
                      padding: '12px 16px',
                      background: '#e8f5e9',
                      borderRadius: 6,
                      minWidth: 120
                    }}>
                      <div style={{ fontSize: 12, color: '#27ae60', marginBottom: 4 }}>Procenjena cena</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#27ae60' }}>
                        {issue.estimatedCost.toLocaleString('sr-RS')} RSD
                      </div>
                    </div>
                  )}
                </div>

                {/* Issue Content */}
                <div style={{ padding: '24px' }}>
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: 6,
                    padding: '16px',
                    marginBottom: 20
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#2c3e50' }}>
                      Opis problema
                    </h4>
                    <p style={{ margin: 0, color: '#495057', fontSize: 14, lineHeight: 1.5 }}>
                      {issue.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {isAssigned && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#2c3e50' }}>
                          Procenjena cena (RSD)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Unesite procenjenu cenu..."
                          value={costMap[issue._id] || ''}
                          onChange={e => setCostMap(prev => ({ ...prev, [issue._id]: e.target.value }))}
                          style={{
                            width: '100%',
                            maxWidth: 300,
                            padding: '12px 16px',
                            border: '1px solid #dee2e6',
                            borderRadius: 6,
                            fontSize: 14,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          disabled={!costMap[issue._id] || loading}
                          onClick={() => acceptJob(issue._id)}
                          style={{
                            padding: '12px 24px',
                            background: costMap[issue._id] && !loading ? '#27ae60' : '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: costMap[issue._id] && !loading ? 'pointer' : 'not-allowed',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          ✓ Prihvati posao
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => rejectJob(issue._id)}
                          style={{
                            padding: '12px 24px',
                            background: loading ? '#95a5a6' : '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          ✕ Odbij posao
                        </button>
                      </div>
                    </div>
                  )}

                  {isInProgress && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#2c3e50' }}>
                          Napomene o završetku rada
                        </label>
                        <textarea
                          placeholder="Opišite šta je urađeno, koji su materijali korišćeni, napomene..."
                          value={notesMap[issue._id] || ''}
                          onChange={e => setNotesMap(prev => ({ ...prev, [issue._id]: e.target.value }))}
                          style={{
                            width: '100%',
                            minHeight: 80,
                            padding: '12px 16px',
                            border: '1px solid #dee2e6',
                            borderRadius: 6,
                            fontSize: 14,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        disabled={!notesMap[issue._id]?.trim() || loading}
                        onClick={() => completeJob(issue._id)}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '12px 24px',
                          background: notesMap[issue._id]?.trim() && !loading ? '#3498db' : '#95a5a6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: notesMap[issue._id]?.trim() && !loading ? 'pointer' : 'not-allowed',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        ✓ Označi kao završeno
                      </button>
                    </div>
                  )}

                  {isResolved && (
                    <div style={{
                      background: '#d4edda',
                      padding: '16px',
                      borderRadius: 6,
                      color: '#155724',
                      fontSize: 14,
                      fontWeight: 500
                    }}>
                      ✓ Rad je završen i faktura je kreirana za direktora
                      {issue.completionDate && (
                        <div style={{ fontSize: 12, marginTop: 4, fontWeight: 400 }}>
                          Završeno: {new Date(issue.completionDate).toLocaleDateString('sr-RS')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssociateDashboard;
