/* eslint-disable max-lines, max-lines-per-function, complexity, max-depth, no-console, no-mixed-operators, react/no-array-index-key */
import React, { useState, useEffect, useMemo } from 'react';

import Modal from '../Modal';
import PieChart from '../PieChart';

import TenantProfile from './TenantProfile';

function TenantDashboard({ user, tenantNav, setTenantNav, onUserUpdate }) {
  const [issue, setIssue] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('low');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  const [notices, setNotices] = useState([]);
  const [, setNoticesLoading] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  // Polls state
  const [polls, setPolls] = useState([]);
  const [, setPollsLoading] = useState(false);
  const [noticeSort, setNoticeSort] = useState('newest');
  // Issue filters
  const [issueSort, setIssueSort] = useState('newest'); // 'newest' or 'oldest'
  const [issueStatus, setIssueStatus] = useState('all'); // 'all' shows all, others filter by specific status
  const [issueViewFilter, setIssueViewFilter] = useState('my'); // 'all' or 'my'
  const [allBuildingIssues, setAllBuildingIssues] = useState([]); // For 'all issues' view
    // Stats & changes/micro-feed
    const [, setBuildingStats] = useState(null);
    const [changesSince, setChangesSince] = useState(null);
    const [etaAckMsg, setEtaAckMsg] = useState('');

  // Get JWT from localStorage (assumes it's stored there after login/signup)
  const token = localStorage.getItem('token');
  console.log('TenantDashboard - Token from localStorage:', token ? 'present' : 'missing', token?.substring(0, 20) + '...');

  // Fetch user's reported issues
  useEffect(() => {
    if (!token) return;
    console.log('🔍 Fetching tenant issues from /api/issues/my');
    setLoading(true);
    fetch('http://localhost:5000/api/issues/my', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Tenant issues received:', Array.isArray(data.data) ? data.data.length : 0, 'issues');
        if (Array.isArray(data.data)) setIssues(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Error fetching tenant issues:', err);
        setLoading(false);
      });
  }, [token, success]); // refetch on new issue

  // Fetch all building issues when viewing 'all' filter (requires manager+ privileges on backend, but we'll try)
  useEffect(() => {
    if (!token || !user?.building || issueViewFilter !== 'all') return;
    console.log('🔍 Fetching all building issues from /api/issues');
    // Note: This endpoint might not be accessible to tenants - graceful fallback
    fetch('http://localhost:5000/api/issues', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Not authorized');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.data)) {
          // Filter to only issues from this building
          const buildingIssues = data.data.filter(issue => 
            issue.tenant?.building?._id === user.building || 
            issue.tenant?.building === user.building
          );
          console.log('✅ All building issues received:', buildingIssues.length, 'issues');
          setAllBuildingIssues(buildingIssues);
        }
      })
      .catch(err => {
        console.log('⚠️ Cannot fetch all building issues:', err);
        // Fallback to showing only user's issues
        setAllBuildingIssues(issues);
      });
  }, [token, user?.building, issueViewFilter, issues]);

  // Fetch notices for building
  useEffect(() => {
    if (!token || !user?.building) return;
    console.log('🔍 Fetching notices from /api/buildings/' + user.building + '/notices');
    setNoticesLoading(true);
    fetch(`http://localhost:5000/api/buildings/${user.building}/notices`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Notices received:', Array.isArray(data.data) ? data.data.length : 0, 'notices');
        if (Array.isArray(data.data)) setNotices(data.data);
        setNoticesLoading(false);
      })
      .catch((err) => {
        console.error('❌ Error fetching notices:', err);
        setNoticesLoading(false);
      });
  }, [token, user?.building]);

  // Fetch polls for building
  useEffect(() => {
    if (!token || !user?.building) return;
    console.log('🔍 Fetching polls from /api/buildings/' + user.building + '/polls');
    setPollsLoading(true);
    fetch(`http://localhost:5000/api/buildings/${user.building}/polls`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Polls received:', Array.isArray(data.data) ? data.data.length : 0, 'polls');
        if (Array.isArray(data.data)) setPolls(data.data);
        setPollsLoading(false);
      })
      .catch((err) => {
        console.error('❌ Error fetching polls:', err);
        setPollsLoading(false);
      });
  }, [token, user?.building]);

  // Fetch building stats and changes since last visit
  useEffect(() => {
    if (!token || !user?.building) return;
    fetch(`http://localhost:5000/api/buildings/${user.building}/stats`, {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json()).then(setBuildingStats).catch(() => {});
    const lastVisit = localStorage.getItem('tenantOverviewLastVisit');
    const sinceISO = (lastVisit ? new Date(Number(lastVisit)) : new Date(Date.now() - 24*60*60*1000)).toISOString();
    fetch(`http://localhost:5000/api/buildings/${user.building}/changes-since?since=${encodeURIComponent(sinceISO)}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json()).then(setChangesSince).catch(() => {});
  }, [token, user?.building]);

  // Vote in a poll
  const handleVote = async (pollId, option) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ option })
      });
      if (!res.ok) throw new Error('Failed to vote');
      // Refresh polls
      const bId = user?.building;
      if (bId) {
        const pr = await fetch(`http://localhost:5000/api/buildings/${bId}/polls`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (pr.ok) {
          setPolls(await pr.json());
        }
      }
    } catch (e) {
      console.error(e);
      alert('Glasanje neuspešno. Molimo pokušajte ponovo.');
    }
  };

  // Submit a new issue
  const handleReport = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Molimo dodajte naslov.');
      setSuccess('');
      return;
    }
    if (!issue.trim()) {
      setError('Molimo opišite problem.');
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ title, description: issue, priority })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Kvar prijavljen!');
        setIssue('');
        setTitle('');
        setPriority('low');
        setShowIssueModal(false);
        // Refetch issues
        const issuesRes = await fetch('http://localhost:5000/api/issues/my', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          if (Array.isArray(issuesData)) setIssues(issuesData);
        }
      } else {
        setError(data.message || 'Neuspešno prijavljivanje kvara.');
      }
    } catch (err) {
      setError('Neuspešno prijavljivanje kvara.');
    }
  };

  // Post a new notice
  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeContent.trim()) {
      setError('Molimo unesite sadržaj obaveštenja.');
      setSuccess('');
      return;
    }
    if (!user?.building) {
      setError('Zgrada nije dodeljena. Ne možete objaviti obaveštenje.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${user.building}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ content: noticeContent })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Obaveštenje objavljeno!');
        setNoticeContent('');
        // Refetch notices
        fetch(`http://localhost:5000/api/buildings/${user.building}/notices`, {
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data.data)) setNotices(data.data);
          });
      } else {
        setError(data.message || 'Neuspešno objavljivanje obaveštenja.');
      }
    } catch (err) {
      setError('Neuspešno objavljivanje obaveštenja.');
    }
  };

  // Delete a notice (only if author)
  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notices/${noticeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || 'Neuspešno brisanje obaveštenja');
        return;
      }
      // Refresh notices
      if (user?.building) {
        const nr = await fetch(`http://localhost:5000/api/buildings/${user.building}/notices`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (nr.ok) setNotices(await nr.json());
      }
    } catch (e) {
      alert('Neuspešno brisanje obaveštenja');
    }
  };

  // Helper to map status to badge class and label
  const statusClass = (s) => {
    if (!s) return 'badge reported';
    const st = s.toLowerCase();
    if (st === 'reported' || st === 'open') return 'badge reported';
    if (st === 'forwarded') return 'badge forwarded';
    if (st === 'assigned') return 'badge in-review';
    if (st === 'in progress' || st === 'in-progress') return 'badge in-progress';
    if (st === 'resolved') return 'badge done';
    if (st === 'rejected') return 'badge rejected';
    return 'badge reported';
  };

  // Nicely formatted status label for display; default to 'Reported'
  const statusLabel = (s) => {
    const st = (s || 'reported').toString().toLowerCase().replace(/-/g, ' ');
    if (st === 'open') return 'Prijavljen';
    if (st === 'reported') return 'Prijavljen';
    if (st === 'forwarded') return 'Prosleđen direktoru';
    if (st === 'assigned') return 'Dodeljen';
    if (st === 'in progress') return 'U toku';
    if (st === 'resolved') return 'Završen';
    if (st === 'rejected') return 'Odbijen';
    return st.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
  };

  // Overview helpers
  const latestNotice = useMemo(() => (notices && notices.length ? notices[0] : null), [notices]);
  const unvotedPolls = useMemo(() => (polls || []).filter(p => !p.votes?.some(v => v.voter === user._id)), [polls, user?._id]);
  const lastIssue = useMemo(() => (issues && issues.length ? issues[0] : null), [issues]);
  const notices7dCount = useMemo(() => (notices || []).filter(n => Date.now() - new Date(n.createdAt).getTime() < 7*24*60*60*1000).length, [notices]);
  const openIssuesCount = useMemo(() => (issues || []).filter(i => !['resolved','rejected'].includes((i.status||'reported').toLowerCase())).length, [issues]);
  const pollsToVoteCount = unvotedPolls.length;

  // basic unread marker for latest notice using localStorage timestamp
  const lastSeenNoticeAt = Number(localStorage.getItem('lastSeenNoticeAt') || 0);
  const latestNoticeTime = latestNotice ? new Date(latestNotice.createdAt).getTime() : 0;
  const hasNewNotice = latestNoticeTime > lastSeenNoticeAt;
  const markNoticesRead = () => {
    if (latestNoticeTime) localStorage.setItem('lastSeenNoticeAt', String(latestNoticeTime));
  };

  // Helpers
  const formatCountdown = (when) => {
    if (!when) return '';
    const diff = new Date(when).getTime() - Date.now();
    if (diff <= 0) return 'uskoro';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return [d ? `${d}d` : null, h ? `${h}h` : null, m ? `${m}m` : null].filter(Boolean).join(' ');
  };

  // Acknowledge ETA and ICS export for last issue
  const handleEtaAck = async () => {
    if (!lastIssue?.eta) return;
    try {
      const res = await fetch(`http://localhost:5000/api/issues/${lastIssue._id}/eta-ack`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setEtaAckMsg('Potvrđeno. Obavestićemo tim za popravke.');
        // refresh issues
        fetch('http://localhost:5000/api/issues/my', { headers: { 'Authorization': 'Bearer ' + token } })
          .then(r => r.json()).then(d => Array.isArray(d) && setIssues(d));
      } else {
        setEtaAckMsg(data.message || 'Neuspešno potvrđivanje');
      }
    } catch {
      setEtaAckMsg('Neuspešno potvrđivanje');
    }
  };
  const icsHref = useMemo(() => {
    if (!lastIssue?.eta) return '';
    const dt = new Date(lastIssue.eta);
    const dtEnd = new Date(dt.getTime() + 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const body = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Aplikacija//EN', 'BEGIN:VEVENT',
      `UID:${lastIssue._id}@tennet`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(dt)}`,
      `DTEND:${fmt(dtEnd)}`,
      'SUMMARY:Poseta za popravku',
      `DESCRIPTION:${(lastIssue.description || '').replace(/\n/g, ' ')}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    return 'data:text/calendar;charset=utf8,' + encodeURIComponent(body);
  }, [lastIssue]);

  // Render profile without the card container for full-width look
  if (tenantNav === 'profile') {
    return (
      <div>
        <TenantProfile user={user} token={token} onUserUpdate={onUserUpdate} />
      </div>
    );
  }

  if (tenantNav === 'bulletin') {
    const items = [];
    const COLORS = ['yellow','pink','green','blue','purple','orange','lime','cyan','rose','violet'];
    let noticeIdx = 0;
    let pollIdx = 0;
    for (const n of (notices || [])) items.push({
      _id: `notice-${n._id}`,
      noticeId: n._id,
      type: 'notice',
      date: n.createdAt,
      title: n.title || 'Obaveštenje',
      body: n.content,
      color: COLORS[noticeIdx++ % COLORS.length],
      author: n.authorName || 'Uprava',
      authorRole: n.authorRole || '',
      // Only show delete button for tenant's own notices (UI parity with manager, no manager override here)
      canDelete: (user && String(user._id) === String(n.author))
    });
    for (const p of (polls || [])) items.push({
      _id: `poll-${p._id}`,
      type: 'poll',
      date: p.createdAt,
      title: p.question,
      poll: p,
      color: COLORS[pollIdx++ % COLORS.length]
    });
    items.sort((a,b)=> noticeSort==='newest' ? new Date(b.date)-new Date(a.date) : new Date(a.date)-new Date(b.date));
    return (
      <div style={{overflowX:'hidden'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, margin:'12px 4px', flexWrap:'wrap'}}>
          <h2 style={{margin:0}}>Oglasna tabla</h2>
          <div style={{display:'flex', gap:8}}>
            <button className={noticeSort==='newest'?'btn':'btn ghost'} onClick={()=>setNoticeSort('newest')}>Najnoviji</button>
            <button className={noticeSort==='oldest'?'btn':'btn ghost'} onClick={()=>setNoticeSort('oldest')}>Najstariji</button>
          </div>
        </div>
        <div style={{display:'flex',gap:8,margin:'8px 4px'}}>
          <button className="btn-flat btn-flat-primary" onClick={()=>setShowNoticeModal(true)}>Novo obaveštenje</button>
        </div>
        <div className="postit-grid" style={{marginTop:8}}>
          {items.map(item => (
            <div
              key={item._id}
              className={`postit ${item.color}`}
              style={(() => {
                const HEX = { yellow:'#FEF08A', pink:'#FBCFE8', green:'#BBF7D0', blue:'#BAE6FD', purple:'#E9D5FF', orange:'#FED7AA', lime:'#ECFCCB', cyan:'#CFFAFE', rose:'#FFE4E6', violet:'#DDD6FE' };
                const darken=(hex,amt=0.25)=>{let h=hex.replace('#',''); if(h.length===3)h=h.split('').map(c=>c+c).join(''); const num=parseInt(h,16); let r=(num>>16)&255,g=(num>>8)&255,b=num&255; r=Math.max(0,Math.round(r*(1-amt))); g=Math.max(0,Math.round(g*(1-amt))); b=Math.max(0,Math.round(b*(1-amt))); return '#'+(1<<24 | (r<<16)|(g<<8)|b).toString(16).slice(1);};
                const base = HEX[item.color] || '#ffffff';
                if (item.type === 'notice') {
                  // Exact manager bulletin logic: outline only if manager-authored via authorRole
                  const isMgr = item.authorRole === 'manager';
                  if (isMgr) {
                    const outlineColor = darken(base,0.25);
                    return { border:`2px solid ${outlineColor}` };
                  }
                  return {};
                }
                if (item.type === 'poll') {
                  const outlineColor = darken(base,0.25);
                  return { border:`2px solid ${outlineColor}` };
                }
                return {};
              })()}
            >
              <div className="meta">{new Date(item.date).toISOString().slice(0,10)}</div>
              <div className="title">{item.title}</div>
              {item.type === 'notice' ? (
                <>
                  <div>{item.body}</div>
                  <div className="meta" style={{marginTop:8}}>{item.author}</div>
                  {item.canDelete && (
                    <button
                      className="btn-flat btn-flat-outline"
                      style={{marginTop:8,fontSize:12,padding:'4px 8px'}}
                      onClick={()=>handleDeleteNotice(item.noticeId)}
                    >Obriši</button>
                  )}
                </>
              ) : (
                <>
                  <div style={{marginTop:4}}>
                    {(() => {
                      const data = item.poll.options.map(opt => ({label:opt, value:item.poll.votes.filter(v => v.option===opt).length}));
                      return <PieChart data={data} size={100} />;
                    })()}
                  </div>
                  {(() => {
                    const voteCounts = item.poll.options.map(opt => item.poll.votes.filter(v=>v.option===opt).length);
                    const maxVotes = Math.max(0,...voteCounts);
                    const leaders = item.poll.options.filter((opt,idx)=>voteCounts[idx]===maxVotes && maxVotes>0);
                    const isClosed = !!item.poll.closedAt;
                    return (
                      <div style={{marginTop:8}}>
                        <div style={{fontSize:12,fontWeight:600}}>
                          {isClosed ? (
                            leaders.length===0 ? 'Zatvoreno • Nema glasova' : `Zatvoreno • Pobednik${leaders.length>1?'i':''}: ${leaders.join(', ')}`
                          ) : (
                            leaders.length===0 ? 'Još nema glasova' : (leaders.length>1 ? `Nerešeno: ${leaders.join(', ')}` : `Vodi: ${leaders[0]}`)
                          )}
                        </div>
                        {!isClosed && (
                          <div style={{display:'flex', flexDirection:'column', gap:6, marginTop:6}}>
                            {item.poll.options.map(opt => (
                              <button key={opt} className="btn" onClick={()=>handleVote(item.poll._id, opt)}>{opt}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ))}
          {items.length === 0 && <div className="muted">Nema sadržaja.</div>}
        </div>
        {showNoticeModal && (
          <Modal title="Objavi obaveštenje" onClose={()=>setShowNoticeModal(false)}>
            <form onSubmit={(e)=>{handlePostNotice(e); if(noticeContent.trim()) setShowNoticeModal(false);}} style={{display:'grid',gap:12}}>
              <textarea rows={4} placeholder="Podelite obaveštenje za zgradu..." value={noticeContent} onChange={e=>setNoticeContent(e.target.value)} />
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type="submit" className="btn-flat btn-flat-primary">Objavi obaveštenje</button>
                <button type="button" className="btn-flat btn-flat-outline" onClick={()=>{setNoticeContent('');setShowNoticeModal(false);}}>Otkaži</button>
              </div>
            </form>
            {success && <div style={{marginTop:8,color:'green',fontSize:13}}>{success}</div>}
            {error && <div style={{marginTop:8,color:'red',fontSize:13}}>{error}</div>}
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          {/* dynamic title per tenantNav to avoid repeating 'Tenant Dashboard' */}
          <h2>{
            tenantNav === 'dashboard' ? 'Kontrolna tabla stanara' :
            tenantNav === 'issues' ? 'Moji kvarovi' : 'Kontrolna tabla stanara'
          }</h2>
          <div className="muted">Dobrodošli nazad, {user?.firstName || user?.username}</div>
        </div>

        {/* Keep report available via button on Overview/Issues; legacy route retained */}
        

        {(tenantNav === 'issues') && (
          <div>
            <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap'}}>
              <button className="btn-flat btn-flat-primary" onClick={() => setShowIssueModal(true)}>Prijavi kvar</button>
            </div>
            {error && <div style={{color:'red',marginTop:8, marginBottom:8}}>{error}</div>}
            {success && <div style={{color:'green',marginTop:8, marginBottom:8}}>{success}</div>}
            
            {/* Issue View Filter: All Issues vs My Issues */}
            <div style={{display:'flex', gap:12, marginBottom:16, alignItems:'center'}}>
              <button 
                className={issueViewFilter === 'my' ? 'btn' : 'btn ghost'}
                onClick={() => setIssueViewFilter('my')}
                style={{background: issueViewFilter === 'my' ? '#10b981' : undefined}}
              >
                Moji kvarovi
              </button>
              <button 
                className={issueViewFilter === 'all' ? 'btn' : 'btn ghost'}
                onClick={() => setIssueViewFilter('all')}
                style={{background: issueViewFilter === 'all' ? '#10b981' : undefined}}
              >
                Svi kvarovi u zgradi
              </button>
            </div>

            <div className="card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
              <h4>{issueViewFilter === 'my' ? 'Vaši kvarovi' : 'Svi kvarovi u zgradi'}</h4>
              <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                <label style={{marginRight:4,fontSize:'0.9em'}}>Status:</label>
                <select value={issueStatus} onChange={e => setIssueStatus(e.target.value)} style={{fontSize:'0.9em',padding:'4px 8px'}}>
                  <option value="all">Svi statusi</option>
                  <option value="reported">Prijavljen</option>
                  <option value="forwarded">Prosleđen direktoru</option>
                  <option value="assigned">Dodeljen</option>
                  <option value="in-progress">U toku</option>
                  <option value="resolved">Završen</option>
                  <option value="rejected">Odbijen</option>
                </select>
                <label style={{marginLeft:8,marginRight:4,fontSize:'0.9em'}}>Sortiraj:</label>
                <select value={issueSort} onChange={e => setIssueSort(e.target.value)} style={{fontSize:'0.9em',padding:'4px 8px'}}>
                  <option value="newest">Najnoviji prvo</option>
                  <option value="oldest">Najstariji prvo</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div>Učitavanje...</div>
            ) : (
              <ul className="issue-list">
                {(() => {
                  const displayIssues = issueViewFilter === 'my' ? issues : allBuildingIssues;
                  if (displayIssues.length === 0) return <li>Nema prijavljenih kvarova.</li>;
                  
                  const filtered = [...displayIssues]
                    .filter(iss => {
                      if (issueStatus === 'all' || issueStatus === 'reported') return true;
                      const s = (iss.status || 'reported').toLowerCase().replace(/\s+/g,'-');
                      return s === issueStatus;
                    })
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt);
                      const dateB = new Date(b.createdAt);
                      return issueSort === 'newest' ? dateB - dateA : dateA - dateB;
                    });
                  
                  if (filtered.length === 0) return <li>Nema kvarova sa izabranim filterom.</li>;
                  
                  return filtered.map((iss) => (
                    <li key={iss._id}>
                      <div>
                        <div style={{fontWeight:700}}>{iss.title || 'Kvar'}</div>
                        <div className="meta">
                          {new Date(iss.createdAt).toLocaleString()}
                          {issueViewFilter === 'all' && iss.tenant && (
                            <span> • Stan {iss.tenant.apartment?.unitNumber || 'N/A'}</span>
                          )}
                        </div>
                        <div className="muted">{iss.description}</div>
                        <div style={{fontSize:'0.9em',marginTop:4}}>
                          <span style={{color:iss.priority==='high'?'#b00':iss.priority==='medium'?'#f59e0b':'#10b981',fontWeight:600}}>
                            {iss.priority === 'high' ? '🔴 Visok' : iss.priority === 'medium' ? '🟡 Srednji' : '🟢 Nizak'} prioritet
                          </span>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div className={statusClass(iss.status)}>{statusLabel(iss.status)}</div>
                      </div>
                    </li>
                  ));
                })()}
              </ul>
            )}
          </div>
        )}

        {/* Bulletin page removed */}

        {(tenantNav === 'dashboard' || tenantNav === 'overview') && (
          <div>
            {/* Overview hero */}
            <div className="overview-hero" style={{marginBottom:12}}>
              <div>
                <div className="hello">Zdravo{user?.firstName ? `, ${user.firstName}` : ''}</div>
                <div className="muted">Evo šta se dešava u vašoj zgradi</div>
              </div>
              <div className="kpi-chips">
                <div className="chip sage"><span className="dot"/> {openIssuesCount} aktivnih kvarova</div>
                <div className="chip indigo"><span className="dot"/> {pollsToVoteCount} za glasanje</div>
                <div className="chip amber"><span className="dot"/> {notices7dCount} obaveštenja ove nedelje</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
              <div className="card accent-teal">
                <h4 style={{marginTop:0}}>Brze radnje</h4>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button className="btn-flat btn-flat-primary" onClick={() => setTenantNav('issues')}>Prijavi kvar</button>
                  <button className="btn-flat btn-flat-outline" onClick={() => setTenantNav('issues')}>Prikaži moje kvarove</button>
                </div>
              </div>
              {/* At a Glance */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(0, 1fr))',gap:12}}>
                {/* Most Recent Notice */}
                <div className="card accent-amber" style={{padding:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <h4 style={{margin:0}}>📢 Najnovije obaveštenje</h4>
                    {hasNewNotice && <span className="badge forwarded">Novo</span>}
                  </div>
                  {latestNotice ? (
                    <div style={{marginTop:8}}>
                      <div style={{fontWeight:600}}>{latestNotice.content}</div>
                      <div className="meta">Od {latestNotice.authorName || 'Anoniman'} • {new Date(latestNotice.createdAt).toLocaleString()}</div>
                      {hasNewNotice && <button className="btn ghost" style={{marginTop:8}} onClick={markNoticesRead}>Označi kao pročitano</button>}
                    </div>
                  ) : (
                    <div className="muted">Još nema obaveštenja.</div>
                  )}
                </div>

                {/* Polls awaiting your vote */}
                <div className="card accent-indigo" style={{padding:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <h4 style={{margin:0}}>🗳️ Ankete za glasanje</h4>
                    <span className="badge in-progress">{pollsToVoteCount}</span>
                  </div>
                  {pollsToVoteCount > 0 ? (
                    <div style={{marginTop:8}}>
                      <div className="muted" style={{marginBottom:6}}>Evo jedne koja čeka na vas:</div>
                      {(() => {
                        const poll = unvotedPolls[0];
                        const voteCounts = poll.options.map(opt => poll.votes.filter(v => v.option === opt).length);
                        const data = poll.options.map((opt, i) => ({ label: opt, value: voteCounts[i] }));
                        return (
                          <div>
                            <div style={{fontWeight:600, marginBottom:6}}>{poll.question}</div>
                            <PieChart data={data} size={140} />
                            <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:6}}>
                              {poll.options.map(opt => (
                                <button key={opt} className="btn" onClick={() => handleVote(poll._id, opt)}>{opt}</button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="muted" style={{marginTop:8}}>Sve je ažurno.</div>
                  )}
                </div>

                {/* Last reported issue */}
                <div className="card accent-rose" style={{padding:12}}>
                  <h4 style={{margin:0}}>🛠️ Poslednji prijavljeni kvar</h4>
                  {lastIssue ? (
                    <div style={{marginTop:8}}>
                      <div style={{fontWeight:600}}>{lastIssue.description}</div>
                      <div className="meta">Prijavljeno {new Date(lastIssue.createdAt).toLocaleString()}</div>
                      <div style={{marginTop:6}}><span className={statusClass(lastIssue.status)}>{statusLabel(lastIssue.status)}</span></div>
                      <div className="muted" style={{fontSize:12, marginTop:6}}>
                        {lastIssue.assignee ? `Dodeljeno za ${lastIssue.assignee}` : 'Čeka dodelu'}
                      </div>
                      <button className="btn ghost" style={{marginTop:8}} onClick={() => setTenantNav('issues')}>Prikaži sve</button>
                    </div>
                  ) : (
                    <div className="muted">Nema prijavljenih kvarova.</div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="card accent-sage" style={{padding:12}}>
                  <h4 style={{margin:0}}>📊 Brza statistika</h4>
                  <ul style={{listStyle:'none',padding:0,marginTop:8,display:'grid',gap:6}}>
                    <li><b>{openIssuesCount}</b> aktivnih kvarova</li>
                    <li><b>{notices7dCount}</b> obaveštenja ove nedelje</li>
                    <li><b>{pollsToVoteCount}</b> anketa čeka na glasanje</li>
                  </ul>
                </div>
              </div>
              {/* Micro-feed, Service alerts, Poll digest, Weekly schedule */}
              <div style={{marginTop:12}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(0, 1fr))',gap:12}}>
                  {/* Micro-feed */}
                  <div className="card accent-sky" style={{padding:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <h4 style={{margin:0}}>🧭 Od vaše poslednje posete</h4>
                      <button className="btn ghost" onClick={() => localStorage.setItem('tenantOverviewLastVisit', String(Date.now()))}>Označi kao viđeno</button>
                    </div>
                    {changesSince ? (
                      <div style={{marginTop:8}} className="muted">
                        {(changesSince.notices || 0)} novih obaveštenja, {(changesSince.polls || 0)} novih anketa, {(changesSince.issueUpdates || 0)} ažuriranja kvarova
                      </div>
                    ) : <div className="muted" style={{marginTop:8}}>Učitavanje…</div>}
                  </div>

                  {/* Service alerts */}
                  <div className="card accent-amber" style={{padding:12}}>
                    <h4 style={{margin:0}}>⚠️ Servisna upozorenja</h4>
                    <ul style={{listStyle:'none',padding:0, marginTop:8}}>
                      {(notices||[])
                        .filter(n => ['service','elevator','delivery'].includes(n.type))
                        .slice(0,3)
                        .map(n => (
                          <li key={n._id} style={{marginBottom:8}}>
                            <span className={`pill ${n.type}`}>{n.type === 'service' ? 'Održavanje' : n.type === 'elevator' ? 'Lift' : 'Dostava'}</span> <span className="muted">•</span> {n.content}
                            {n.expiresAt && <span className="meta"> • do {new Date(n.expiresAt).toLocaleString()}</span>}
                          </li>
                        ))}
                      {(!notices || !(notices.filter(n => ['service','elevator','delivery'].includes(n.type)).length)) && <li className="muted">Nema aktivnih upozorenja</li>}
                    </ul>
                  </div>

                  {/* Poll digest (voted) */}
                  <div className="card accent-teal" style={{padding:12}}>
                    <h4 style={{margin:0}}>📈 Pregled anketa</h4>
                    <div style={{marginTop:8}}>
                      {(polls||[]).filter(p => p.votes?.some(v => v.voter === user._id)).slice(0,3).map(p => {
                        const totals = p.options.map(opt => p.votes.filter(v => v.option === opt).length);
                        const sum = totals.reduce((a,b)=>a+b,0)||1;
                        return (
                          <div key={p._id} style={{marginBottom:10}}>
                            <div style={{fontWeight:600}}>{p.question}</div>
                            <div className="meta">Rezultati do sada</div>
                            {p.options.map((opt,i) => (
                              <div key={opt} style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:8, alignItems:'center'}}>
                                <div className="meta">{opt}</div>
                                <div className="progress">
                                  <div className="bar" style={{width:`${Math.round(100*totals[i]/sum)}%`}} />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      {(!(polls||[]).some(p => p.votes?.some(v => v.voter === user._id))) && <div className="muted">Još niste glasali ni u jednoj anketi.</div>}
                    </div>
                  </div>

                  {/* Weekly maintenance */}
                  <div className="card accent-indigo" style={{padding:12}}>
                    <h4 style={{margin:0}}>🗓️ Ove nedelje</h4>
                    <ul style={{listStyle:'none', padding:0, marginTop:8}}>
                      {(notices||[])
                        .filter(n => (['service','elevator','delivery'].includes(n.type)) && ((n.expiresAt && (new Date(n.expiresAt).getTime() - Date.now()) < 7*24*60*60*1000) || (Date.now() - new Date(n.createdAt).getTime()) < 7*24*60*60*1000))
                        .slice(0,5)
                        .map(n => (
                          <li key={n._id}>
                            <span style={{fontWeight:600}}>{new Date(n.expiresAt || n.createdAt).toLocaleDateString()}</span>: {n.content}
                          </li>
                        ))}
                      {(!notices || !(notices.filter(n => (['service','elevator','delivery'].includes(n.type)) && ((n.expiresAt && (new Date(n.expiresAt).getTime() - Date.now()) < 7*24*60*60*1000) || (Date.now() - new Date(n.createdAt).getTime()) < 7*24*60*60*1000)).length)) && <li className="muted">Ništa zakazano</li>}
                    </ul>
                  </div>
                </div>
              </div>
              {/* Last issue details: ETA & history */}
              {lastIssue && (
                <div className="card accent-teal" style={{marginTop:12}}>
                  <h4 style={{marginTop:0}}>Vaš najnoviji kvar</h4>
                  <div className="muted">{new Date(lastIssue.createdAt).toLocaleString()}</div>
                  {lastIssue.eta && (
                    <div style={{marginTop:8}}>
                      <div style={{fontWeight:600}}>Popravka zakazana za {new Date(lastIssue.eta).toLocaleString()} ({formatCountdown(lastIssue.eta)})</div>
                      <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                        {!lastIssue.etaAckByTenant && <button className="btn" onClick={handleEtaAck}>Biću kod kuće</button>}
                        <a className="btn ghost" href={icsHref} download={`repair-${lastIssue._id}.ics`}>Dodaj u kalendar</a>
                      </div>
                      {etaAckMsg && <div className="muted" style={{marginTop:6}}>{etaAckMsg}</div>}
                    </div>
                  )}
                  <div style={{marginTop:10}}>
                    <div style={{fontWeight:600}}>Nedavna ažuriranja</div>
                    <ul style={{listStyle:'none', padding:0, marginTop:6}}>
                      {(lastIssue.history || []).slice(-3).reverse().map((h,i) => (
                        <li key={i} className="meta">{new Date(h.at || lastIssue.updatedAt || lastIssue.createdAt).toLocaleString()} • {h.action} {h.note ? `— ${h.note}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div>
                <h4>Nedavni kvarovi</h4>
                <ul className="issue-list">
                  {issues.slice(0,3).map(iss => (
                    <li key={iss._id}>
                      <div>
                        <div style={{fontWeight:700}}>{iss.title}</div>
                        <div className="meta">{new Date(iss.createdAt).toLocaleString()}</div>
                        <div className="muted">{iss.description}</div>
                        <div style={{fontSize:'0.9em',color:iss.priority==='high'?'#b00':'#555'}}>
                          Prioritet: {iss.priority === 'high' ? 'Visok' : iss.priority === 'medium' ? 'Srednji' : 'Nizak'}
                        </div>
                      </div>
                      <div>{<div className={statusClass(iss.status)}>{statusLabel(iss.status)}</div>}</div>
                    </li>
                  ))}
                  {issues.length === 0 && <li>Nema nedavnih kvarova</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* polls tab merged into bulletin */}

      </div>
      
      {/* Issue Reporting Modal */}
      {showIssueModal && (
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
            maxWidth: 600
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: '#2c3e50' }}>Prijavite kvar</h3>
            <form onSubmit={handleReport} style={{display:'grid',gap:12}}>
              <div>
                <label style={{display:'block', marginBottom:5, fontSize:14, color:'#2c3e50'}}>Naslov</label>
                <input 
                  type="text"
                  placeholder="Kratak naslov (npr. Curenje česme)" 
                  value={title} 
                  onChange={e=>setTitle(e.target.value)}
                  style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:4, fontSize:14}}
                />
              </div>
              <div>
                <label style={{display:'block', marginBottom:5, fontSize:14, color:'#2c3e50'}}>Opis</label>
                <textarea 
                  placeholder="Opišite problem detaljno..." 
                  value={issue} 
                  onChange={e=>setIssue(e.target.value)} 
                  rows={5}
                  style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:4, fontSize:14}}
                />
              </div>
              <div>
                <label style={{display:'block', marginBottom:8, fontSize:14, color:'#2c3e50'}}>Hitnost</label>
                <div style={{display:'flex', gap:15}}>
                  <label style={{display:'flex', alignItems:'center', gap:5}}>
                    <input type="radio" name="priority" value="low" checked={priority === 'low'} onChange={() => setPriority('low')} />
                    <span>Niska</span>
                  </label>
                  <label style={{display:'flex', alignItems:'center', gap:5}}>
                    <input type="radio" name="priority" value="medium" checked={priority === 'medium'} onChange={() => setPriority('medium')} />
                    <span>Srednja</span>
                  </label>
                  <label style={{display:'flex', alignItems:'center', gap:5}}>
                    <input type="radio" name="priority" value="high" checked={priority === 'high'} onChange={() => setPriority('high')} />
                    <span>Visoka</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop:10 }}>
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowIssueModal(false); 
                    setTitle(''); 
                    setIssue(''); 
                    setPriority('low'); 
                    setError('');
                  }} 
                  style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Otkaži
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '10px 20px', background: '#198654', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Prijavi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantDashboard;

