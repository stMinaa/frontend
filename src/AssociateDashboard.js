import React, { useEffect, useState } from 'react';
import AssociateProfile from './AssociateProfile';

function AssociateDashboard({ user, activeTab }) {
  const token = localStorage.getItem('token');
  const tab = activeTab === 'profile' ? 'profile' : 'jobs';
  const [issues, setIssues] = useState([]);
  const [costMap, setCostMap] = useState({});
  const [notesMap, setNotesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/associates/me/jobs`, { 
        headers: { 'Authorization': 'Bearer ' + token } 
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setIssues(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadIssues(); }, []);

  const acceptJob = async (issueId) => {
    const cost = costMap[issueId];
    if (!cost || cost <= 0) {
      setMsg('Unesite procenjenu cenu');
      setMsgType('error');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/issues/${issueId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ estimatedCost: Number(cost) })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        setMsg(data.message || 'Prihvatanje posla neuspelo');
        setMsgType('error');
        return;
      }
      setMsg('Posao prihvaćen! Možete nastaviti sa radom.');
      setMsgType('success');
      setCostMap(prev => ({ ...prev, [issueId]: '' }));
      loadIssues();
    } catch (err) {
      setMsg('Prihvatanje posla neuspelo');
      setMsgType('error');
    }
  };

  const rejectJob = async (issueId) => {
    if (!window.confirm('Da li ste sigurni da želite da odbijete ovaj posao?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/issues/${issueId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ reason: 'Declined by associate' })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        setMsg(data.message || 'Odbijanje posla neuspelo');
        setMsgType('error');
        return;
      }
      setMsg('Posao odbijen');
      setMsgType('success');
      loadIssues();
    } catch (err) {
      setMsg('Odbijanje posla neuspelo');
      setMsgType('error');
    }
  };

  const completeJob = async (issueId) => {
    const notes = notesMap[issueId];
    if (!notes || !notes.trim()) {
      setMsg('Unesite napomene o završetku');
      setMsgType('error');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/issues/${issueId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ completionNotes: notes })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        setMsg(data.message || 'Završavanje posla neuspelo');
        setMsgType('error');
        return;
      }
      setMsg('Posao završen i prijavljen šefu!');
      setMsgType('success');
      setNotesMap(prev => ({ ...prev, [issueId]: '' }));
      loadIssues();
    } catch (err) {
      setMsg('Završavanje posla neuspelo');
      setMsgType('error');
    }
  };

  if (tab === 'profile') return <AssociateProfile user={user} token={token} />;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Dodeljeni poslovi</h2>
        <div className="muted">Upravljajte svojim servisnim zadacima</div>
      </div>
      {msg && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: msgType === 'error' ? '#fee2e2' : '#dcfce7', color: msgType === 'error' ? '#7f1d1d' : '#166534', fontSize: 13 }}>{msg}</div>}
      <div>
        {loading ? <div className="muted">Učitavanje…</div> : (
          <ul style={{padding:0,margin:0}}>
            {issues.length === 0 && <li className="muted" style={{listStyle:'none'}}>Nema dodeljenih poslova.</li>}
            {issues.map(iss => {
              const status = iss.status;
              const isAssigned = status === 'assigned';
              const isInProgress = status === 'in progress';
              const isResolved = status === 'resolved';
              const tenantObj = iss.tenant || {};
              const buildingObj = tenantObj.building || {};
              const apartmentObj = tenantObj.apartment || {};
              const address = apartmentObj.address || buildingObj.address || buildingObj.name || '—';
              const unitNumber = apartmentObj.unitNumber != null ? apartmentObj.unitNumber : '—';
              const tenantName = `${tenantObj.firstName || ''} ${tenantObj.lastName || ''}`.trim() || '—';
              return (
                <li key={iss._id} style={{ listStyle:'none', margin:0, padding:0 }}>
                  <div style={{
                    background:'#ffffff',
                    border:'1px solid #e2e8f0',
                    borderRadius:12,
                    padding:'16px',
                    marginBottom:14,

                    display:'flex',
                    flexDirection:'column',
                    gap:12
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                      <div style={{flex:1, minWidth:200}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                          <div style={{fontSize:16,fontWeight:700,lineHeight:1.2}}>{iss.title || 'Problem'}</div>
                          <span style={{background:'#f1f5f9',color:'#334155',fontSize:11,padding:'4px 8px',borderRadius:14}}>{iss.urgency === 'urgent' ? '🔴 Hitno' : 'Nije hitno'}</span>
                          <span style={{background: isResolved?'#dcfce7': isInProgress?'#ccfbf1': isAssigned?'#fef3c7':'#e2e8f0', color:'#0f172a', fontSize:11, padding:'4px 8px', borderRadius:14, fontWeight:600}}>{status}</span>
                        </div>
                        <div style={{fontSize:12,color:'#64748b',marginTop:4}}>📅 {new Date(iss.createdAt).toLocaleString()}</div>
                        <div style={{fontSize:12,color:'#475569',marginTop:8}}>
                          <div>👤 <strong>{tenantName}</strong> • Stan {unitNumber}</div>
                          <div>📍 {address}</div>
                          {iss.eta && <div>🕐 ETA: {new Date(iss.eta).toLocaleString()}</div>}
                        </div>
                      </div>
                      {iss.cost && (
                        <div style={{padding:10, background:'#f0f9ff', borderRadius:8, textAlign:'center', minWidth:100}}>
                          <div style={{fontSize:11, color:'#0369a1', textTransform:'uppercase'}}>Procenjena cena</div>
                          <div style={{fontWeight:700, fontSize:18, color:'#0369a1'}}>€{iss.cost.toFixed(2)}</div>
                        </div>
                      )}
                    </div>

                    <div style={{background:'#f8fafc', borderRadius:8, padding:12}}>
                      <div style={{fontSize:13, fontWeight:600, marginBottom:6, color:'#0f172a'}}>Detalji problema</div>
                      <div style={{fontSize:13, color:'#475569', whiteSpace:'pre-line'}}>{iss.description}</div>
                    </div>

                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {isAssigned && (
                        <>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Procenjena cena (€)"
                            value={costMap[iss._id] || ''}
                            onChange={e=>setCostMap(prev=>({...prev,[iss._id]:e.target.value}))}
                            style={{ padding:'10px', border:'1px solid #d0d7de', borderRadius:8, fontSize:13 }}
                          />
                          <div style={{display:'flex', gap:8}}>
                            <button className="btn" disabled={!costMap[iss._id]} onClick={()=>acceptJob(iss._id)} style={{flex:1}}>✅ Prihvati posao</button>
                            <button className="btn ghost" onClick={()=>rejectJob(iss._id)} style={{flex:1}}>❌ Odbij posao</button>
                          </div>
                        </>
                      )}
                      {isInProgress && (
                        <>
                          <textarea
                            placeholder="Napomene o završetku rada..."
                            value={notesMap[iss._id] || ''}
                            onChange={e=>setNotesMap(prev=>({...prev,[iss._id]:e.target.value}))}
                            style={{ padding:10, border:'1px solid #d0d7de', borderRadius:8, fontSize:13, minHeight:70, fontFamily:'inherit', resize:'vertical' }}
                          />
                          <button className="btn" disabled={!notesMap[iss._id]} onClick={()=>completeJob(iss._id)}>✔️ Prijavi završetak rada</button>
                        </>
                      )}
                      {isResolved && (
                        <div style={{background:'#dcfce7', padding:10, borderRadius:8, color:'#166534', fontSize:13, fontWeight:600}}>
                          ✅ Rad završen {iss.completionDate ? new Date(iss.completionDate).toLocaleDateString() : 'datum'}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AssociateDashboard;
