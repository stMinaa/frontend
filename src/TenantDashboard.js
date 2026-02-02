
import React, { useState, useEffect, useMemo } from 'react';
import PieChart from './components/PieChart';
import TenantProfile from './TenantProfile';
import Modal from './components/Modal';

function TenantDashboard({ user, tenantNav, setTenantNav }) {
  const [issue, setIssue] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('low');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  // Polls state
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollError, setPollError] = useState('');
  const [pollSuccess, setPollSuccess] = useState('');
  const [noticeSort, setNoticeSort] = useState('newest');
  // Issue filters
  const [issueSort, setIssueSort] = useState('newest'); // 'newest' or 'oldest'
  const [issueStatus, setIssueStatus] = useState('reported'); // 'reported' acts as "all", others filter narrowly
    // Stats & changes/micro-feed
    const [buildingStats, setBuildingStats] = useState(null);
    const [changesSince, setChangesSince] = useState(null);
    const [etaAckMsg, setEtaAckMsg] = useState('');

  // Get JWT from localStorage (assumes it's stored there after login/signup)
  const token = localStorage.getItem('token');

  // Post-it color mapping to hex for pie palette
  const POSTIT_COLOR_HEX = {
    yellow: '#FEF08A',
    pink: '#FBCFE8',
    green: '#BBF7D0',
    blue: '#BAE6FD',
    purple: '#E9D5FF',
    orange: '#FED7AA',
    lime: '#ECFCCB',
    cyan: '#CFFAFE',
    rose: '#FFE4E6',
    violet: '#DDD6FE'
  };
  const darkenHex = (hex, amt = 0.1) => {
    let h = hex.replace('#','');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.round(r * (1 - amt)));
    g = Math.max(0, Math.round(g * (1 - amt)));
    b = Math.max(0, Math.round(b * (1 - amt)));
    return `#${(1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };
  const shadeSeries = (baseHex, n) => {
    if (!n || n <= 0) return [];
    if (n === 1) return [baseHex];
    const start = 0.05; // slight darken even for first slice to avoid too pale
    const range = 0.35; // how dark the darkest slice gets
    const step = n > 1 ? (range / (n - 1)) : 0;
    return Array.from({ length: n }, (_, i) => darkenHex(baseHex, start + i * step));
  };

  // Fetch user's reported issues
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('http://localhost:5000/api/issues/my', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setIssues(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, success]); // refetch on new issue

  // Fetch notices for building
  useEffect(() => {
    if (!token || !user?.building) return;
    setNoticesLoading(true);
    fetch(`http://localhost:5000/api/buildings/${user.building}/notices`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotices(data);
        setNoticesLoading(false);
      })
      .catch(() => setNoticesLoading(false));
  }, [token, user?.building]);

  // Fetch polls for building
  useEffect(() => {
    if (!token || !user?.building) return;
    setPollsLoading(true);
    fetch(`http://localhost:5000/api/buildings/${user.building}/polls`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPolls(data);
        setPollsLoading(false);
      })
      .catch(() => setPollsLoading(false));
  }, [token, user?.building, pollSuccess]);

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
      alert('Voting failed. Please try again.');
    }
  };

  // Submit a new issue
  const handleReport = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please add a title.');
      setSuccess('');
      return;
    }
    if (!issue.trim()) {
      setError('Please describe the issue.');
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
        setSuccess('Issue reported!');
        setIssue('');
        setTitle('');
        setPriority('low');
      } else {
        setError(data.message || 'Failed to report issue.');
      }
    } catch (err) {
      setError('Failed to report issue.');
    }
  };

  // Post a new notice
  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeContent.trim()) {
      setError('Please enter notice content.');
      setSuccess('');
      return;
    }
    if (!user?.building) {
      setError('No building assigned. Cannot post notice.');
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
        setSuccess('Notice posted!');
        setNoticeContent('');
        // Refetch notices
        fetch(`http://localhost:5000/api/buildings/${user.building}/notices`, {
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setNotices(data);
          });
      } else {
        setError(data.message || 'Failed to post notice.');
      }
    } catch (err) {
      setError('Failed to post notice.');
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
        alert(data.message || 'Failed to delete notice');
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
      alert('Failed to delete notice');
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
    if (st === 'open') return 'Reported';
    if (st === 'in progress') return 'In progress';
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
    if (diff <= 0) return 'about now';
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
        setEtaAckMsg('Acknowledged. We’ll let the repair team know.');
        // refresh issues
        fetch('http://localhost:5000/api/issues/my', { headers: { 'Authorization': 'Bearer ' + token } })
          .then(r => r.json()).then(d => Array.isArray(d) && setIssues(d));
      } else {
        setEtaAckMsg(data.message || 'Failed to acknowledge');
      }
    } catch {
      setEtaAckMsg('Failed to acknowledge');
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
      'SUMMARY:Repair visit',
      `DESCRIPTION:${(lastIssue.description || '').replace(/\n/g, ' ')}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    return 'data:text/calendar;charset=utf8,' + encodeURIComponent(body);
  }, [lastIssue]);

  // Render profile without the card container for full-width look
  if (tenantNav === 'profile') {
    return (
      <div>
        <TenantProfile user={user} token={token} />
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
          <button className="btn-flat btn-flat-primary" onClick={()=>setShowNoticeModal(true)}>New Notice</button>
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
                    return { border:`2px solid ${outlineColor}`, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' };
                  }
                  return { boxShadow:'0 8px 18px rgba(0,0,0,0.08)' };
                }
                if (item.type === 'poll') {
                  const outlineColor = darken(base,0.25);
                  return { border:`2px solid ${outlineColor}`, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' };
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
                    >Delete</button>
                  )}
                </>
              ) : (
                <>
                  <div style={{marginTop:4}}>
                    {(() => {
                      const baseHex = POSTIT_COLOR_HEX[item.color] || '#3A5A40';
                      const data = item.poll.options.map(opt => ({label:opt, value:item.poll.votes.filter(v => v.option===opt).length}));
                      const cols = shadeSeries(baseHex, data.length);
                      // Use default PieChart pastel purples/greens/blues palette instead of single-color shades
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
                            leaders.length===0 ? 'Closed • No votes' : `Closed • Winner${leaders.length>1?'s':''}: ${leaders.join(', ')}`
                          ) : (
                            leaders.length===0 ? 'No votes yet' : (leaders.length>1 ? `Tie: ${leaders.join(', ')}` : `Leading: ${leaders[0]}`)
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
          <Modal title="Post a Notice" onClose={()=>setShowNoticeModal(false)}>
            <form onSubmit={(e)=>{handlePostNotice(e); if(noticeContent.trim()) setShowNoticeModal(false);}} style={{display:'grid',gap:12}}>
              <textarea rows={4} placeholder="Share a building notice..." value={noticeContent} onChange={e=>setNoticeContent(e.target.value)} />
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type="submit" className="btn-flat btn-flat-primary">Post Notice</button>
                <button type="button" className="btn-flat btn-flat-outline" onClick={()=>{setNoticeContent('');setShowNoticeModal(false);}}>Cancel</button>
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
            tenantNav === 'dashboard' ? 'Tenant Dashboard' :
            tenantNav === 'issues' ? 'My Issues' : 'Tenant Dashboard'
          }</h2>
          <div className="muted">Welcome back, {user?.firstName || user?.username}</div>
        </div>

        {/* Keep report available via button on Overview/Issues; legacy route retained */}
        

        {(tenantNav === 'issues') && (
          <div>
            <div className="card" style={{padding:16, marginBottom:16, border:'1px solid #e2e8f0'}}>
              <h4 style={{marginTop:0}}>Report a Building Issue</h4>
              <form onSubmit={handleReport} style={{display:'grid',gap:8}}>
                <input placeholder="Short title (e.g., Leaking sink)" value={title} onChange={e=>setTitle(e.target.value)} />
                <textarea placeholder="Describe the issue..." value={issue} onChange={e=>setIssue(e.target.value)} rows={5} />
                <div>
                  <label style={{marginRight:8}}>
                    <input type="radio" name="priority" value="high" checked={priority === 'high'} onChange={() => setPriority('high')} /> High
                  </label>
                  <label style={{marginRight:8}}>
                    <input type="radio" name="priority" value="medium" checked={priority === 'medium'} onChange={() => setPriority('medium')} /> Medium
                  </label>
                  <label>
                    <input type="radio" name="priority" value="low" checked={priority === 'low'} onChange={() => setPriority('low')} /> Low
                  </label>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn-flat btn-flat-primary" type="submit">Report Issue</button>
                  <button type="button" className="btn-flat btn-flat-outline" onClick={() => { setTitle(''); setIssue(''); setPriority('low'); }}>Clear</button>
                </div>
              </form>
              {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
              {success && <div style={{color:'green',marginTop:8}}>{success}</div>}
            </div>
            <div className="card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h4>Your Issues</h4>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <label style={{marginRight:4,fontSize:'0.9em'}}>Status:</label>
                <select value={issueStatus} onChange={e => setIssueStatus(e.target.value)} style={{fontSize:'0.9em'}}>
                  <option value="reported">Reported</option>
                  <option value="forwarded">Forwarded</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <label style={{marginLeft:8,marginRight:4,fontSize:'0.9em'}}>Sort by:</label>
                <select value={issueSort} onChange={e => setIssueSort(e.target.value)} style={{fontSize:'0.9em'}}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <ul className="issue-list">
                {issues.length === 0 && <li>No issues reported yet.</li>}
                {[...issues]
                  .filter(iss => {
                    if (issueStatus === 'reported') return true;
                    const s = (iss.status || 'reported').toLowerCase().replace(/\s+/g,'-');
                    return s === issueStatus;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return issueSort === 'newest' ? dateB - dateA : dateA - dateB;
                  })
                  .map((iss) => (
                    <li key={iss._id}>
                      <div>
                        <div style={{fontWeight:700}}>{iss.title || 'Issue'}</div>
                        <div className="meta">{new Date(iss.createdAt).toLocaleString()}</div>
                        <div className="muted">{iss.description}</div>
                        <div style={{fontSize:'0.9em',color:iss.priority==='high'?'#b00':'#555'}}>
                          Priority: {iss.priority === 'high' ? 'High' : iss.priority === 'medium' ? 'Medium' : 'Low'}
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div className={statusClass(iss.status)}>{statusLabel(iss.status)}</div>
                      </div>
                    </li>
                  ))}
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
                <div className="hello">Hello{user?.firstName ? `, ${user.firstName}` : ''} 👋</div>
                <div className="muted">Here’s what’s happening in your building</div>
              </div>
              <div className="kpi-chips">
                <div className="chip sage"><span className="dot"/> {openIssuesCount} active issue(s)</div>
                <div className="chip indigo"><span className="dot"/> {pollsToVoteCount} to vote</div>
                <div className="chip amber"><span className="dot"/> {notices7dCount} notices this week</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
              <div className="card accent-teal">
                <h4 style={{marginTop:0}}>Quick Actions</h4>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button className="btn-flat btn-flat-primary" onClick={() => setTenantNav('issues')}>Report Issue</button>
                  <button className="btn-flat btn-flat-outline" onClick={() => setTenantNav('issues')}>View My Issues</button>
                </div>
              </div>
              {/* At a Glance */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(0, 1fr))',gap:12}}>
                {/* Most Recent Notice */}
                <div className="card accent-amber" style={{padding:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <h4 style={{margin:0}}>📢 Most Recent Notice</h4>
                    {hasNewNotice && <span className="badge forwarded">New</span>}
                  </div>
                  {latestNotice ? (
                    <div style={{marginTop:8}}>
                      <div style={{fontWeight:600}}>{latestNotice.content}</div>
                      <div className="meta">By {latestNotice.authorName || 'Anonymous'} • {new Date(latestNotice.createdAt).toLocaleString()}</div>
                      {hasNewNotice && <button className="btn ghost" style={{marginTop:8}} onClick={markNoticesRead}>Mark as read</button>}
                    </div>
                  ) : (
                    <div className="muted">No notices yet.</div>
                  )}
                </div>

                {/* Polls awaiting your vote */}
                <div className="card accent-indigo" style={{padding:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <h4 style={{margin:0}}>🗳️ Polls To Vote</h4>
                    <span className="badge in-progress">{pollsToVoteCount}</span>
                  </div>
                  {pollsToVoteCount > 0 ? (
                    <div style={{marginTop:8}}>
                      <div className="muted" style={{marginBottom:6}}>Here’s one waiting for you:</div>
                      {(() => {
                        const poll = unvotedPolls[0];
                        const voteCounts = poll.options.map(opt => poll.votes.filter(v => v.option === opt).length);
                        const data = poll.options.map((opt, i) => ({ label: opt, value: voteCounts[i] }));
                        const baseHex = '#4F46E5'; // indigo to match card accent
                        // Use default PieChart pastel palette (purples/greens/blues)
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
                    <div className="muted" style={{marginTop:8}}>You’re all caught up.</div>
                  )}
                </div>

                {/* Last reported issue */}
                <div className="card accent-rose" style={{padding:12}}>
                  <h4 style={{margin:0}}>🛠️ Last Reported Issue</h4>
                  {lastIssue ? (
                    <div style={{marginTop:8}}>
                      <div style={{fontWeight:600}}>{lastIssue.description}</div>
                      <div className="meta">Reported {new Date(lastIssue.createdAt).toLocaleString()}</div>
                      <div style={{marginTop:6}}><span className={statusClass(lastIssue.status)}>{statusLabel(lastIssue.status)}</span></div>
                      <div className="muted" style={{fontSize:12, marginTop:6}}>
                        {lastIssue.assignee ? `Assigned to ${lastIssue.assignee}` : 'Awaiting assignment'}
                      </div>
                      <button className="btn ghost" style={{marginTop:8}} onClick={() => setTenantNav('issues')}>View all</button>
                    </div>
                  ) : (
                    <div className="muted">No issues reported yet.</div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="card accent-sage" style={{padding:12}}>
                  <h4 style={{margin:0}}>📊 Quick Stats</h4>
                  <ul style={{listStyle:'none',padding:0,marginTop:8,display:'grid',gap:6}}>
                    <li><b>{openIssuesCount}</b> active issue(s)</li>
                    <li><b>{notices7dCount}</b> notice(s) this week</li>
                    <li><b>{pollsToVoteCount}</b> poll(s) awaiting vote</li>
                  </ul>
                </div>
              </div>
              {/* Micro-feed, Service alerts, Poll digest, Weekly schedule */}
              <div style={{marginTop:12}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(0, 1fr))',gap:12}}>
                  {/* Micro-feed */}
                  <div className="card accent-sky" style={{padding:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <h4 style={{margin:0}}>🧭 Since your last visit</h4>
                      <button className="btn ghost" onClick={() => localStorage.setItem('tenantOverviewLastVisit', String(Date.now()))}>Mark as seen</button>
                    </div>
                    {changesSince ? (
                      <div style={{marginTop:8}} className="muted">
                        {(changesSince.notices || 0)} new notice(s), {(changesSince.polls || 0)} new poll(s), {(changesSince.issueUpdates || 0)} issue update(s)
                      </div>
                    ) : <div className="muted" style={{marginTop:8}}>Loading…</div>}
                  </div>

                  {/* Service alerts */}
                  <div className="card accent-amber" style={{padding:12}}>
                    <h4 style={{margin:0}}>⚠️ Service alerts</h4>
                    <ul style={{listStyle:'none',padding:0, marginTop:8}}>
                      {(notices||[])
                        .filter(n => ['service','elevator','delivery'].includes(n.type))
                        .slice(0,3)
                        .map(n => (
                          <li key={n._id} style={{marginBottom:8}}>
                            <span className={`pill ${n.type}`}>{n.type === 'service' ? 'Maintenance' : n.type === 'elevator' ? 'Elevator' : 'Delivery'}</span> <span className="muted">•</span> {n.content}
                            {n.expiresAt && <span className="meta"> • until {new Date(n.expiresAt).toLocaleString()}</span>}
                          </li>
                        ))}
                      {(!notices || !(notices.filter(n => ['service','elevator','delivery'].includes(n.type)).length)) && <li className="muted">No active alerts</li>}
                    </ul>
                  </div>

                  {/* Poll digest (voted) */}
                  <div className="card accent-teal" style={{padding:12}}>
                    <h4 style={{margin:0}}>📈 Poll digest</h4>
                    <div style={{marginTop:8}}>
                      {(polls||[]).filter(p => p.votes?.some(v => v.voter === user._id)).slice(0,3).map(p => {
                        const totals = p.options.map(opt => p.votes.filter(v => v.option === opt).length);
                        const sum = totals.reduce((a,b)=>a+b,0)||1;
                        return (
                          <div key={p._id} style={{marginBottom:10}}>
                            <div style={{fontWeight:600}}>{p.question}</div>
                            <div className="meta">Results so far</div>
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
                      {(!(polls||[]).some(p => p.votes?.some(v => v.voter === user._id))) && <div className="muted">No polls voted yet.</div>}
                    </div>
                  </div>

                  {/* Weekly maintenance */}
                  <div className="card accent-indigo" style={{padding:12}}>
                    <h4 style={{margin:0}}>🗓️ This week</h4>
                    <ul style={{listStyle:'none', padding:0, marginTop:8}}>
                      {(notices||[])
                        .filter(n => (['service','elevator','delivery'].includes(n.type)) && ((n.expiresAt && (new Date(n.expiresAt).getTime() - Date.now()) < 7*24*60*60*1000) || (Date.now() - new Date(n.createdAt).getTime()) < 7*24*60*60*1000))
                        .slice(0,5)
                        .map(n => (
                          <li key={n._id}>
                            <span style={{fontWeight:600}}>{new Date(n.expiresAt || n.createdAt).toLocaleDateString()}</span>: {n.content}
                          </li>
                        ))}
                      {(!notices || !(notices.filter(n => (['service','elevator','delivery'].includes(n.type)) && ((n.expiresAt && (new Date(n.expiresAt).getTime() - Date.now()) < 7*24*60*60*1000) || (Date.now() - new Date(n.createdAt).getTime()) < 7*24*60*60*1000)).length)) && <li className="muted">Nothing scheduled</li>}
                    </ul>
                  </div>
                </div>
              </div>
              {/* Last issue details: ETA & history */}
              {lastIssue && (
                <div className="card accent-teal" style={{marginTop:12}}>
                  <h4 style={{marginTop:0}}>Your latest issue</h4>
                  <div className="muted">{new Date(lastIssue.createdAt).toLocaleString()}</div>
                  {lastIssue.eta && (
                    <div style={{marginTop:8}}>
                      <div style={{fontWeight:600}}>Repair scheduled for {new Date(lastIssue.eta).toLocaleString()} ({formatCountdown(lastIssue.eta)})</div>
                      <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                        {!lastIssue.etaAckByTenant && <button className="btn" onClick={handleEtaAck}>I’ll be home</button>}
                        <a className="btn ghost" href={icsHref} download={`repair-${lastIssue._id}.ics`}>Add to calendar</a>
                      </div>
                      {etaAckMsg && <div className="muted" style={{marginTop:6}}>{etaAckMsg}</div>}
                    </div>
                  )}
                  <div style={{marginTop:10}}>
                    <div style={{fontWeight:600}}>Recent updates</div>
                    <ul style={{listStyle:'none', padding:0, marginTop:6}}>
                      {(lastIssue.history || []).slice(-3).reverse().map((h,i) => (
                        <li key={i} className="meta">{new Date(h.at || lastIssue.updatedAt || lastIssue.createdAt).toLocaleString()} • {h.action} {h.note ? `— ${h.note}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div>
                <h4>Recent Issues</h4>
                <ul className="issue-list">
                  {issues.slice(0,3).map(iss => (
                    <li key={iss._id}>
                      <div>
                        <div style={{fontWeight:700}}>{iss.title}</div>
                        <div className="meta">{new Date(iss.createdAt).toLocaleString()}</div>
                        <div className="muted">{iss.description}</div>
                        <div style={{fontSize:'0.9em',color:iss.priority==='high'?'#b00':'#555'}}>
                          Priority: {iss.priority === 'high' ? 'High' : iss.priority === 'medium' ? 'Medium' : 'Low'}
                        </div>
                      </div>
                      <div>{<div className={statusClass(iss.status)}>{statusLabel(iss.status)}</div>}</div>
                    </li>
                  ))}
                  {issues.length === 0 && <li>No recent issues</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* polls tab merged into bulletin */}

      </div>
    </div>
  );
}

export default TenantDashboard;
