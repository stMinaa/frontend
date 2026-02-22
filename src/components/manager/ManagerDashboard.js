/* eslint-disable max-lines, max-lines-per-function, complexity, max-depth, no-console, no-mixed-operators, react/no-array-index-key */
import React, { useState, useEffect } from 'react';

import Modal from '../Modal';
import PieChart from '../PieChart';

import ManagerProfile from './ManagerProfile';

function ManagerDashboard({ user, activeTab = 'home' }) {
  // Bulk apartment creation state
  const [_showBulkForm, setShowBulkForm] = useState(false);
  const [bulkFloors, setBulkFloors] = useState('');
  const [bulkUnits, setBulkUnits] = useState('');
  const [bulkStartNumber, setBulkStartNumber] = useState('1');
  const [_bulkError, setBulkError] = useState('');
  const [_bulkLoading, setBulkLoading] = useState(false);

  // Bulk create handler
  const _handleBulkCreate = async (e) => {
    e.preventDefault();
    setBulkError('');
    setBulkLoading(true);
    // Parse floors and units per floor
    const floors = parseInt(bulkFloors);
    if (isNaN(floors) || floors < 1) {
      setBulkError('Unesite validan broj spratova.');
      setBulkLoading(false);
      return;
    }
    const startNumber = parseInt(bulkStartNumber);
    if (isNaN(startNumber) || startNumber < 1) {
      setBulkError('Unesite validan početni broj stana.');
      setBulkLoading(false);
      return;
    }
    // Accept comma-separated units per floor (e.g. 3,4,5)
    let unitsArr = bulkUnits.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (unitsArr.length === 0) {
      setBulkError('Unesite stanove po spratu (razdvojeno zarezom, npr. 3,4,5).');
      setBulkLoading(false);
      return;
    }
    // If only one value, repeat for all floors
    if (unitsArr.length === 1) unitsArr = Array(floors).fill(unitsArr[0]);
    // If fewer values than floors, pad with last value
    if (unitsArr.length < floors) {
      const last = unitsArr[unitsArr.length-1];
      unitsArr = [...unitsArr, ...Array(floors-unitsArr.length).fill(last)];
    }
    // If more values than floors, trim
    if (unitsArr.length > floors) unitsArr = unitsArr.slice(0, floors);
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/apartments/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ floors, unitsPerFloor: unitsArr, startNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setShowBulkForm(false);
        setBulkFloors('');
        setBulkUnits('');
        setBulkStartNumber('1');
        // Refresh apartments list
        fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/apartments`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
          .then(res => res.json())
          .then(data => setApartments(data));
      } else {
        setBulkError(data.message || 'Grupno kreiranje neuspelo.');
      }
    } catch (err) {
      setBulkError('Grupno kreiranje neuspelo.');
    }
    setBulkLoading(false);
  };
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [_apartments, setApartments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [message, setMessage] = useState('');
  const [globalPendingTenants, setGlobalPendingTenants] = useState([]);
  // Legacy single-select states (no longer used in the new table UI)
  const [assignBuilding] = useState('');
  const [, setAssignApartment] = useState('');
  const [, setAssignBuildingApartments] = useState([]);
  const [apartmentsCache, setApartmentsCache] = useState({}); // { [buildingId]: Apartment[] }

  // Poll state & modal
  const [polls, setPolls] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showPollForm, setShowPollForm] = useState(false); // repurposed as modal toggle
  // Notice modal state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  // Notices state
  const [notices, setNotices] = useState([]);
  const [, setNoticesLoading] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  // Issues state
  const [issues, setIssues] = useState([]);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');
  const [issueUrgency, setIssueUrgency] = useState('all'); // all | urgent | not-urgent
  const [tenantQuery, setTenantQuery] = useState('');
  const [associates, setAssociates] = useState([]);
  const [assignPick, setAssignPick] = useState({}); // { [issueId]: username }

  // Status helpers (match TenantDashboard behavior; map legacy 'open' -> 'reported')
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
  const statusLabel = (s) => {
    const st = (s || 'reported').toString().toLowerCase().replace(/-/g, ' ');
    if (st === 'open') return 'Prijavljen';
    if (st === 'in progress') return 'U toku';
    return st.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
  };

  // Use activeTab directly from parent (TopNav controls)
  const tab = activeTab || 'home';

  // New view state for Buildings tab
  const [viewMode, setViewMode] = useState('list'); // list | tenants | issues | bulletin
  const [buildingSearch, setBuildingSearch] = useState('');

  // Load buildings managed by this manager and all pending tenants
  useEffect(() => {
    async function fetchBuildingsAndPending() {
      try {
        const res = await fetch('http://localhost:5000/api/buildings/managed', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok) {
          setBuildings(data.data);
          // Auto-select first building to avoid double selection UX
          if (!selectedBuilding && Array.isArray(data.data) && data.data.length > 0) {
            setSelectedBuilding(data.data[0]);
          }
        }
        else setMessage(data.message || 'Učitavanje zgrada neuspelo.');

        // No global pending tenants endpoint - will filter on client side when needed
        setGlobalPendingTenants([]);

        // Load associates list
        try {
          const resAssoc = await fetch('http://localhost:5000/api/associates', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
          });
          const assocData = await resAssoc.json();
          if (resAssoc.ok) setAssociates(assocData.data);
        } catch (_) {}
      } catch (err) {
        setMessage('Greška pri učitavanju zgrada ili stanara na čekanju.');
      }
    }
    fetchBuildingsAndPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When choosing a building in the Assign Pending Tenants section, load its apartments
  useEffect(() => {
    async function fetchAssignApts() {
      if (!assignBuilding) { setAssignBuildingApartments([]); return; }
      try {
        const res = await fetch(`http://localhost:5000/api/buildings/${assignBuilding}/apartments`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok) setAssignBuildingApartments(data.data);
        else setAssignBuildingApartments([]);
      } catch (_) {
        setAssignBuildingApartments([]);
      }
    }
    fetchAssignApts();
  }, [assignBuilding]);

  // Load issues for Kvarovi tab when needed
  useEffect(() => {
    async function fetchAllIssues() {
      if (tab !== 'kvarovi' || !buildings.length) return;
      setIssueLoading(true);
      setIssueError('');
      try {
        const res = await fetch('http://localhost:5000/api/issues', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok) {
          setIssues(data.data || []);
        } else {
          setIssueError(data.message || 'Učitavanje kvarova neuspelo.');
        }
      } catch (err) {
        setIssueError('Greška pri učitavanju kvarova.');
      }
      setIssueLoading(false);
    }
    fetchAllIssues();
  }, [tab, buildings]);

  // Helper: ensure apartments for a building are cached
  const _ensureAptsInCache = async (buildingId) => {
    if (!buildingId) return [];
    if (apartmentsCache[buildingId]) return apartmentsCache[buildingId];
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${buildingId}/apartments`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (res.ok) {
        setApartmentsCache(prev => ({ ...prev, [buildingId]: data }));
        return data;
      }
    } catch (_) {}
    return [];
  };

  // Load apartments and tenants for selected building
  useEffect(() => {
    if (!selectedBuilding) return;
    async function fetchApartmentsAndTenants() {
      try {
        const resApt = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/apartments`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const apartmentsData = await resApt.json();
        if (resApt.ok) setApartments(apartmentsData);
        else setMessage(apartmentsData.message || 'Učitavanje stanova neuspelo.');

        const resTen = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const tenantsData = await resTen.json();
        if (resTen.ok) setTenants(tenantsData.data || []);
        else setMessage(tenantsData.message || 'Učitavanje stanara neuspelo.');

        // Fetch pending tenants for this building
        const resPending = await fetch('http://localhost:5000/api/users/pending', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const pendingData = await resPending.json();
        if (resPending.ok && Array.isArray(pendingData.data)) {
          // Filter for this building
          const buildingPending = pendingData.data.filter(t => String(t.building?._id) === String(selectedBuilding._id));
          setPendingTenants(buildingPending);
        } else {
          setPendingTenants([]);
        }

        // Fetch polls for the building
        const resPolls = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/polls`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const pollsData = await resPolls.json();
        if (resPolls.ok) setPolls(pollsData);
        // Fetch notices for the building
        setNoticesLoading(true);
        const resNotices = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/notices`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const noticesData = await resNotices.json();
        if (resNotices.ok && Array.isArray(noticesData)) setNotices(noticesData);
        setNoticesLoading(false);
        // Fetch issues from manager's buildings (backend filters automatically)
        setIssueLoading(true);
        const resIssues = await fetch('http://localhost:5000/api/issues', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const issuesData = await resIssues.json();
        if (resIssues.ok) {
          // Filter to selected building on client side
          const filtered = (issuesData || []).filter(i => i.building && i.building._id === selectedBuilding._id);
          setIssues(filtered);
        } else {
          setIssueError(issuesData.message || 'Učitavanje kvarova neuspelo.');
        }
        setIssueLoading(false);
      } catch (err) {
        setMessage('Greška pri učitavanju stanova/stanara.');
      }
    }
    fetchApartmentsAndTenants();
  }, [selectedBuilding]);

  // Assign tenant to apartment (can be used for global assignment)
  const _assignTenant = async (tenantId, apartmentId, buildingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ apartmentId, buildingId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Stanar uspešno dodeljen.');
        setGlobalPendingTenants(globalPendingTenants.filter(t => t._id !== tenantId));
        // Refresh apartments and tenants
        const resApt = await fetch(`http://localhost:5000/api/buildings/${buildingId}/apartments`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const apartmentsData = await resApt.json();
        if (resApt.ok) {
          setApartments(apartmentsData);
          // Also refresh apartments for Assign Pending Tenants dropdown if same building
          if (assignBuilding === buildingId) setAssignBuildingApartments(apartmentsData);
          // Update table apartments cache for that building
          setApartmentsCache(prev => ({ ...prev, [buildingId]: apartmentsData }));
        }
        
        const resTen = await fetch(`http://localhost:5000/api/buildings/${buildingId}/tenants`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const tenantsData = await resTen.json();
        if (resTen.ok) setTenants(tenantsData);
        // Clear the selected apartment in the global assign UI
        setAssignApartment('');

        // If the assigned tenant is the currently logged-in tenant (edge case), refresh local storage user
        try {
          const meRes = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
          });
          const me = await meRes.json();
          if (meRes.ok && me && me.role === 'tenant') {
            localStorage.setItem('user', JSON.stringify(me));
          }
        } catch (_) {}
      } else setMessage(data.message || 'Dodeljivanje neuspelo.');
    } catch (err) {
      setMessage('Dodeljivanje neuspelo.');
    }
  };

  // Approve pending tenant
  const approveTenant = async (tenantId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.message || 'Odobrenje neuspelo.'); return; }
      setMessage('Stanar odobren.');
      // Refresh tenants for current building
      if (selectedBuilding) {
        fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
          .then(r=>r.json()).then(d => setTenants(d.data || []));
      }
    } catch (_) {
      setMessage('Odobrenje neuspelo.');
    }
  };

  const deleteTenant = async (tenantId) => {
    if (!window.confirm('Obrisati stanara? Ova akcija se ne može poništiti.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}`, {
        method:'DELETE',
        headers:{'Authorization':'Bearer '+localStorage.getItem('token')}
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { setMessage(data.message || 'Brisanje neuspelo.'); return; }
      setMessage('Stanar obrisan.');
      if (selectedBuilding) {
        fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
          .then(r=>r.json()).then(d => setTenants(d.data || []));
      }
    } catch (_) {
      setMessage('Brisanje neuspelo.');
    }
  };

  // Create a new poll
  const createPoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) {
      setMessage('Pitanje za anketu je obavezno.');
      return;
    }
    // Prepare options (trim and remove empties)
    const options = pollOptions.map(o => (o || '').trim()).filter(Boolean);
    if (options.length < 2) {
      setMessage('Unesite najmanje 2 opcije.');
      return;
    }
    if (options.length > 7) {
      setMessage('Maksimum 7 opcija dozvoljeno.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ question: pollQuestion.trim(), options })
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh polls
        const resPolls = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/polls`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const pollsData = await resPolls.json();
        if (resPolls.ok) setPolls(pollsData);
        // Reset form
        setPollQuestion('');
        setPollOptions(['', '']);
        setShowPollForm(false);
        setMessage('Anketa kreirana.');
      } else {
        setMessage(data.message || 'Kreiranje ankete neuspelo.');
      }
    } catch (err) {
      setMessage('Kreiranje ankete neuspelo.');
    }
  };

  // Close a poll
  const closePoll = async (pollId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/polls/${pollId}/close`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        // Refresh polls
        const resPolls = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/polls`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const pollsData = await resPolls.json();
        if (resPolls.ok) setPolls(pollsData);
        setMessage('Anketa zatvorena.');
      } else {
        const data = await res.json().catch(()=>({}));
        setMessage(data.message || 'Zatvaranje ankete neuspelo.');
      }
    } catch (_) {
      setMessage('Zatvaranje ankete neuspelo.');
    }
  };

  const addPollOption = () => setPollOptions([...pollOptions, '']);
  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };
  const removePollOption = (index) => {
    if (pollOptions.length <= 2) {
      setMessage('Najmanje 2 opcije su obavezne.');
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  // Managers do not vote on polls; display results only.

  const handlePostNotice = async (e) => {
    e.preventDefault();
    setNoticeMsg('');
    if (!noticeContent.trim()) { setNoticeMsg('Sadržaj je obavezan.'); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ content: noticeContent })
      });
      const data = await res.json();
      if (res.ok) {
        setNoticeMsg('Obaveštenje objavljeno.');
        setNoticeContent('');
        // Refresh
        const resNotices = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/notices`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const noticesData = await resNotices.json();
        if (resNotices.ok && Array.isArray(noticesData)) setNotices(noticesData);
      } else {
        setNoticeMsg(data.message || 'Objavljivanje neuspelo.');
      }
    } catch (_) {
      setNoticeMsg('Objavljivanje neuspelo.');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notices/${noticeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { setNoticeMsg(data.message || 'Brisanje neuspelo'); return; }
      // Refresh
      const resNotices = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/notices`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const noticesData = await resNotices.json();
      if (resNotices.ok && Array.isArray(noticesData)) setNotices(noticesData);
      setNoticeMsg('Obaveštenje obrisano.');
    } catch (_) {
      setNoticeMsg('Brisanje neuspelo');
    }
  };

  // Profile full-width early return (no card header/nav)
  if (tab === 'profile') {
    return <ManagerProfile user={user} token={localStorage.getItem('token')} />;
  }

  // Empty Home page per spec
  if (tab === 'home') {
    return (
      <div className="card" style={{minHeight:'40vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
        <h2 style={{margin:0}}>Početna</h2>
        <div className="muted" style={{marginTop:8}}>Izaberite "Zgrade" da upravljate Vašim zgradama.</div>
      </div>
    );
  }

  // ============= KVAROVI TAB =============
  if (tab === 'kvarovi') {
    // Manager triage: only show newly reported issues; once assigned/forwarded/rejected they disappear from this view  
    const triage = issues.filter(i => (i.status || 'reported').toLowerCase() === 'reported');
    const filtered = triage.filter(i => issueUrgency === 'all' ? true : (issueUrgency === 'urgent' ? i.priority === 'high' : i.priority !== 'high'));

    return (
      <div style={{maxWidth:1400,margin:'0 auto',padding:'32px 40px'}}>
        <h2 style={{margin:'0 0 24px 0',fontSize:28,fontWeight:600}}>Kvarovi za obradu</h2>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',margin:'6px 0 24px'}}>
          <button className={`btn-flat ${issueUrgency==='all'?'btn-flat-primary':'btn-flat-outline'}`} onClick={()=>setIssueUrgency('all')}>Sve</button>
          <button 
            className={`btn-flat ${issueUrgency==='urgent'?'btn-flat-primary':'btn-flat-outline'}`} 
            onClick={()=>setIssueUrgency('urgent')}
            style={{border: '2px solid #dc3545', color: issueUrgency==='urgent' ? '#fff' : '#dc3545'}}
          >
            Hitno
          </button>
          <button 
            className={`btn-flat ${issueUrgency==='not-urgent'?'btn-flat-primary':'btn-flat-outline'}`} 
            onClick={()=>setIssueUrgency('not-urgent')}
            style={{border: '2px solid #28a745', color: issueUrgency==='not-urgent' ? '#fff' : '#28a745'}}
          >
            Nije hitno
          </button>
          <div className="muted" style={{marginLeft:8,fontSize:14}}>{filtered.length} od {triage.length}</div>
        </div>
        
        {issueLoading && <div>Učitava...</div>}
        {issueError && <div style={{color:'#dc3545',padding:16,border:'1px solid #dc3545',borderRadius:6,marginBottom:16}}>{issueError}</div>}
        
        {!issueLoading && filtered.length === 0 && (
          <div className="card" style={{textAlign:'center',padding:32}}>
            <div className="muted">Nema kvarova za obradu.</div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:24}}>
          {filtered.map(issue => (
            <div key={issue._id} className="card" style={{padding:20}}>
              <div style={{fontSize:20,fontWeight:700,marginBottom:12,color:'#2c3e50'}}>{issue.title}</div>
              
              <div style={{marginBottom:8}}>
                <span style={{fontSize:12,color:'#6c757d',textTransform:'uppercase',letterSpacing:'0.5px'}}>Prioritet:</span>
                <div style={{marginTop:4}}>
                  <span className={`badge ${issue.priority === 'high' ? 'urgent' : issue.priority === 'medium' ? 'medium' : 'low'}`}>
                    {issue.priority === 'high' ? 'Visok' : issue.priority === 'medium' ? 'Srednji' : 'Nizak'}
                  </span>
                </div>
              </div>

              <div style={{marginBottom:12}}>
                <span style={{fontSize:12,color:'#6c757d',textTransform:'uppercase',letterSpacing:'0.5px'}}>Opis:</span>
                <div style={{marginTop:4,color:'#495057',lineHeight:1.4}}>{issue.description}</div>
              </div>

              <div style={{marginBottom:8}}>
                <span style={{fontSize:12,color:'#6c757d',textTransform:'uppercase',letterSpacing:'0.5px'}}>Lokacija:</span>
                <div style={{marginTop:4,color:'#6c757d',fontSize:14}}>
                  {issue.building ? (issue.building.name ? `${issue.building.name}, ${issue.building.address}` : issue.building.address) : ''}
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <span style={{fontSize:12,color:'#6c757d',textTransform:'uppercase',letterSpacing:'0.5px'}}>Stan:</span>
                <div style={{marginTop:4,color:'#6c757d',fontSize:14}}>{issue.apartment ? `Stan ${issue.apartment.unitNumber}` : '-'}</div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <select 
                  value={assignPick[issue._id] || ''} 
                  onChange={e => setAssignPick(prev => ({ ...prev, [issue._id]: e.target.value }))} 
                  style={{padding:'8px 12px',border:'1px solid #d0d7de',borderRadius:4,fontSize:14}}
                >
                  <option value="">Izaberi akciju...</option>
                  <option value="director">Prosledi direktoru</option>
                  {associates.map(a => (
                    <option key={a.username} value={a.username}>
                      Dodeli: {`${a.firstName || ''} ${a.lastName || ''}`.trim()}{a.company ? ` — ${a.company}` : ''}
                    </option>
                  ))}
                </select>

                <div style={{display:'flex',gap:8}}>
                  <button 
                    className="btn-flat btn-flat-primary" 
                    disabled={!assignPick[issue._id]} 
                    onClick={async()=>{
                      const action = assignPick[issue._id];
                      try {
                        if (action === 'director') {
                          // Forward to director
                          const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/triage`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                            body: JSON.stringify({ action: 'forward' })
                          });
                          if (res.ok) {
                            setMessage('Kvar prosleđen direktoru.');
                            setIssues(prev => prev.filter(i => i._id !== issue._id));
                            setAssignPick(prev => {const {[issue._id]:_, ...rest} = prev; return rest;});
                          }
                        } else {
                          // Assign to associate  
                          const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/triage`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                            body: JSON.stringify({ action: 'assign', assignedTo: action })
                          });
                          if (res.ok) {
                            setMessage('Kvar dodeljen saradniku.');
                            setIssues(prev => prev.filter(i => i._id !== issue._id));
                            setAssignPick(prev => {const {[issue._id]:_, ...rest} = prev; return rest;});
                          }
                        }
                      } catch (err) {
                        setMessage('Greška pri obradi kvara.');
                      }
                    }}
                    style={{flex:1}}
                  >
                    Potvrdi
                  </button>
                  
                  <button 
                    className="btn-flat btn-flat-outline" 
                    onClick={async()=>{
                      if (!window.confirm('Odbaciti ovaj kvar? Ova akcija se ne može poništiti.')) return;
                      try {
                        const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/triage`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                          body: JSON.stringify({ action: 'reject' })
                        });
                        if (res.ok) {
                          setMessage('Kvar odbačen.');
                          setIssues(prev => prev.filter(i => i._id !== issue._id));
                          setAssignPick(prev => {const {[issue._id]:_, ...rest} = prev; return rest;});
                        }
                      } catch (err) {
                        setMessage('Greška pri odbacivanju kvara.');
                      }
                    }}
                  >
                    Odbaci
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============= BUILDINGS LIST =============
  if (tab === 'buildings' && viewMode === 'list') {
    const filteredBuildings = buildings.filter(b => {
      const term = buildingSearch.trim().toLowerCase();
      if (!term) return true;
      const name = (b.name || '').toLowerCase();
      const address = (b.address || '').toLowerCase();
      return name.includes(term) || address.includes(term);
    });
    return (
      <div style={{maxWidth:1400,margin:'0 auto',padding:'32px 40px'}}>
        <h2 style={{margin:'0 0 24px 0',fontSize:28,fontWeight:600}}>Zgrade</h2>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap',marginBottom:32}}>
          <input
            type="text"
            placeholder="Pretraži po nazivu ili adresi..."
            value={buildingSearch}
            onChange={e=>setBuildingSearch(e.target.value)}
            style={{padding:'10px 14px',minWidth:300,border:'1px solid #d0d7de',borderRadius:6,fontSize:14}}
          />
          <div className="muted" style={{fontSize:14}}>{filteredBuildings.length} od {buildings.length} zgrada</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:24}}>
          {filteredBuildings.map(b => (
            <div key={b._id} className="card" style={{display:'flex',flexDirection:'column'}}>
              <div style={{height:200,background:'#e9ecef',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {b.imageUrl && b.imageUrl.trim() ? (
                  <img src={b.imageUrl} alt={b.name || 'Building'} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                ) : (
                  <div style={{fontSize:18,color:'#95a5a6',fontWeight:300}}>Nema slike</div>
                )}
              </div>
              <div style={{padding:20,flexGrow:1,display:'flex',flexDirection:'column',gap:12}}>
                {(b.name && b.name.trim()) && <div style={{fontSize:18,fontWeight:600,color:'#2c3e50'}}>{b.name}</div>}
                <div>
                  <div className="muted" style={{fontSize:12,marginBottom:4}}>Lokacija:</div>
                  <div style={{fontSize:14,color:'#7f8c8d'}}>{b.address}</div>
                </div>
                <div>
                  <div className="muted" style={{fontSize:12,marginBottom:4}}>Broj stanova:</div>
                  <div style={{fontSize:24,fontWeight:700,color:'#2c3e50'}}>{b.apartmentCount || 0}</div>
                </div>
              </div>
              <div style={{borderTop:'1px solid #dee2e6'}}>
                {['Detalji zgrade','Kvarovi','Oglasna tabla'].map((lbl,idx) => {
                  const modeMap = {0:'tenants',1:'issues',2:'bulletin'};
                  return (
                    <button 
                      key={lbl} 
                      style={{
                        width:'100%',
                        background:'#fff',
                        border:'none',
                        borderBottom: idx===2?'none':'1px solid #dee2e6',
                        padding:'12px 16px',
                        cursor:'pointer',
                        fontSize:14,
                        color:'#24292e',
                        textAlign:'left',
                        transition:'background 0.2s'
                      }} 
                      onMouseEnter={e => e.target.style.background='#f6f8fa'}
                      onMouseLeave={e => e.target.style.background='#fff'}
                      onClick={() => { setSelectedBuilding(b); setViewMode(modeMap[idx]); }}>
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {buildings.length===0 && (
            <div style={{textAlign:'center',padding:'60px 20px',color:'#7f8c8d',gridColumn:'1/-1'}}>
              <div style={{fontSize:16}}>Nema zgrada</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ensure data for selected building for subviews (existing effect handles fetch)
  if (!selectedBuilding) {
    return <div className="card"><div className="muted">Izaberite zgradu sa liste.</div></div>;
  }

  // Back bar
  const BackBar = () => (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
      <button className="btn-flat btn-flat-outline" onClick={() => setViewMode('list')}>← Nazad na Zgrade</button>
      <h2 style={{margin:0,fontSize:20}}>{selectedBuilding.name || selectedBuilding.address}</h2>
    </div>
  );

  // ============= TENANTS SUBVIEW =============
  if (tab === 'buildings' && viewMode === 'tenants') {
    return (
      <div className="card" style={{padding:18}}>
        <BackBar />
        <h3 style={{marginTop:0}}>Stanari</h3>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}}>
          <input
            type="text"
            placeholder="Pretraži stanare (ime, email, stan, korisničko ime)..."
            value={tenantQuery}
            onChange={e=>setTenantQuery(e.target.value)}
            style={{padding:'6px 10px',minWidth:280,border:'1px solid #d0d7de',borderRadius:6}}
          />
          <div className="muted" style={{fontSize:12}}>{tenants.filter(t=>{
            const q = tenantQuery.trim().toLowerCase();
            if (!q) return true;
            const name = `${t.firstName||''} ${t.lastName||''}`.toLowerCase();
            const email = (t.email||'').toLowerCase();
            const unit = t.apartment? String(t.apartment.unitNumber).toLowerCase() : '';
            const username = (t.username||'').toLowerCase();
            return name.includes(q) || email.includes(q) || unit.includes(q) || username.includes(q);
          }).length} of {tenants.length}</div>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
          <thead>
            <tr style={{textAlign:'left',borderBottom:'1px solid #e2e8f0'}}>
              <th style={{padding:'8px 6px'}}>Ime</th>
              <th style={{padding:'8px 6px'}}>Stan</th>
              <th style={{padding:'8px 6px'}}>Email</th>
              <th style={{padding:'8px 6px'}}>Status</th>
              <th style={{padding:'8px 6px'}}>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {tenants.filter(t=>{
              const q = tenantQuery.trim().toLowerCase();
              if (!q) return true;
              const name = `${t.firstName||''} ${t.lastName||''}`.toLowerCase();
              const email = (t.email||'').toLowerCase();
              const unit = t.apartment? String(t.apartment.unitNumber).toLowerCase() : '';
              const username = (t.username||'').toLowerCase();
              return name.includes(q) || email.includes(q) || unit.includes(q) || username.includes(q);
            }).map(t => (
              <tr key={t._id} style={{borderBottom:'1px solid #f1f5f9'}}>
                <td style={{padding:'8px 6px'}}>{t.firstName} {t.lastName}<div className="muted" style={{fontSize:11}}>{t.username}</div></td>
                <td style={{padding:'8px 6px'}}>{t.apartment?`Stan ${t.apartment.unitNumber}`:'-'}</td>
                <td style={{padding:'8px 6px'}}>{t.email}</td>
                <td style={{padding:'8px 6px'}}><span className={`pill ${t.status==='active'?'good':'warn'}`}>{t.status}</span></td>
                <td style={{padding:'8px 6px'}}>
                  {t.status==='active' && (
                    <button
                      className="btn-flat btn-flat-outline"
                      style={{fontSize:12,padding:'4px 8px'}}
                      onClick={async()=>{
                        if(!window.confirm('Obrisati stanara i osloboditi stan?')) return;
                        try {
                          const res = await fetch(`http://localhost:5000/api/tenants/${t._id}`, { method:'DELETE', headers:{'Authorization':'Bearer '+localStorage.getItem('token')} });
                          if (res.ok) {
                            // refresh tenants & apartments & pending
                            fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} }).then(r=>r.json()).then(d=>setTenants(d.data||[]));
                            fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/apartments`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} }).then(r=>r.json()).then(a=>{
                              setApartments(a.data||[]);
                              setApartmentsCache(prev=>({...prev,[selectedBuilding._id]:a.data||[]}));
                            });
                          }
                        } catch(_) {}
                      }}
                    >Obriši</button>
                  )}
                </td>
              </tr>
            ))}
            {tenants.length===0 && <tr><td colSpan={4} style={{padding:'12px 6px'}} className="muted">Nema stanara.</td></tr>}
          </tbody>
        </table>
        <div style={{marginTop:32}}>
          <h3 style={{margin:'0 0 8px'}}>Zahtevi na čekanju</h3>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
            <thead>
              <tr style={{textAlign:'left',borderBottom:'1px solid #e2e8f0'}}>
                <th style={{padding:'8px 6px'}}>Ime</th>
                <th style={{padding:'8px 6px'}}>Prijavljeni stan</th>
                <th style={{padding:'8px 6px'}}>Email</th>
                <th style={{padding:'8px 6px'}}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {pendingTenants.map(p => (
                <tr key={p._id} style={{borderBottom:'1px solid #f1f5f9'}}>
                  <td style={{padding:'8px 6px'}}>{p.firstName} {p.lastName}</td>
                  <td style={{padding:'8px 6px'}}>{p.requestedApartment? `Stan ${p.requestedApartment.unitNumber}` : '-'}</td>
                  <td style={{padding:'8px 6px'}}>{p.email}</td>
                  <td style={{padding:'8px 6px',display:'flex',gap:8}}>
                    <button className="btn-flat btn-flat-primary" onClick={()=>approveTenant(p._id)}>Odobri</button>
                    <button className="btn-flat btn-flat-outline" onClick={()=>deleteTenant(p._id)}>Obriši</button>
                  </td>
                </tr>
              ))}
              {pendingTenants.length===0 && <tr><td colSpan={4} style={{padding:'12px 6px'}} className="muted">Nema zahteva na čekanju.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============= ISSUES SUBVIEW =============
  if (tab === 'buildings' && viewMode === 'issues') {
    // Manager triage: only show newly reported issues; once assigned/forwarded/rejected they disappear from this view
    const triage = issues.filter(i => (i.status || 'reported').toLowerCase() === 'reported');
    const filtered = triage.filter(i => issueUrgency === 'all' ? true : (issueUrgency === 'urgent' ? i.priority === 'high' : i.priority !== 'high'));
    return (
      <div className="card" style={{padding:18}}>
        <BackBar />
        <h3 style={{marginTop:0}}>Kvarovi u zgradi</h3>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',margin:'6px 0 16px'}}>
          <button className={`btn-flat ${issueUrgency==='all'?'btn-flat-primary':'btn-flat-outline'}`} onClick={()=>setIssueUrgency('all')}>Sve</button>
          <button 
            className={`btn-flat ${issueUrgency==='urgent'?'btn-flat-primary':'btn-flat-outline'}`} 
            onClick={()=>setIssueUrgency('urgent')}
            style={{border: '2px solid #dc3545', color: issueUrgency==='urgent' ? '#fff' : '#dc3545'}}
          >
            Hitno
          </button>
          <button 
            className={`btn-flat ${issueUrgency==='not-urgent'?'btn-flat-primary':'btn-flat-outline'}`} 
            onClick={()=>setIssueUrgency('not-urgent')}
            style={{border: '2px solid #28a745', color: issueUrgency==='not-urgent' ? '#fff' : '#28a745'}}
          >
            Nije hitno
          </button>
          <div className="muted" style={{marginLeft:8,fontSize:12}}>{filtered.length} of {triage.length}</div>
        </div>
        {filtered.length===0 && <div className="muted">Nema kvarova za obradu.</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {filtered.map(issue => (
            <div key={issue._id} className="card" style={{padding:16}}>
              <div style={{fontSize:24,fontWeight:700, textAlign:'center', lineHeight:1.2, marginBottom:8}}>{issue.title}</div>
              <div style={{fontWeight:700, textAlign:'center'}}>Prioritet:</div>
              <div style={{textAlign:'center', marginBottom:10}}>{issue.priority==='high' ? 'Visok' : issue.priority==='medium' ? 'Srednji' : 'Nizak'}</div>
              <div style={{fontWeight:600, marginTop:6}}>Opis:</div>
              <div style={{color:'#334155'}}>{issue.description}</div>
              <div style={{fontWeight:600, marginTop:10}}>Lokacija:</div>
              <div className="muted">{issue.building ? (issue.building.name ? `${issue.building.name}, ${issue.building.address}` : issue.building.address) : ''}</div>
              <div style={{fontWeight:600, marginTop:6}}>Stan:</div>
              <div className="muted">{issue.apartment ? issue.apartment.unitNumber : '-'}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginTop:12,flexWrap:'wrap'}}>
                <span className={statusClass(issue.status)}>{statusLabel(issue.status)}</span>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <select value={assignPick[issue._id] || ''} onChange={e => setAssignPick(prev => ({ ...prev, [issue._id]: e.target.value }))} style={{padding:'6px 8px'}}>
                    <option value="">Izaberi servis</option>
                    {associates.map(a => (
                      <option key={a.username} value={a.username}>{`${a.firstName || ''} ${a.lastName || ''}`.trim()}{a.company?` — ${a.company}`:''}</option>
                    ))}
                  </select>
                  <button className="btn-flat btn-flat-primary" disabled={!assignPick[issue._id]} onClick={async()=>{
                    try {
                      const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/triage`, { method:'PATCH', headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')}, body: JSON.stringify({ action: 'assign', assignedTo: assignPick[issue._id] }) });
                      if (res.ok) {
                        // Optimistically remove from triage list
                        setIssues(prev => prev.filter(i => i._id !== issue._id));
                        // Refresh in background to keep in sync
                        fetch('http://localhost:5000/api/issues', { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
                          .then(r=>r.json())
                          .then(all=>{ if (Array.isArray(all)) setIssues((all||[]).filter(i=>i.building && i.building._id===selectedBuilding._id)); });
                      }
                    } catch(_) {}
                  }}>Dodeli</button>
                  <button className="btn-flat btn-flat-outline" onClick={async()=>{
                    try {
                      const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/triage`, { method:'PATCH', headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')}, body: JSON.stringify({ action: 'forward' }) });
                      if (res.ok) {
                        setIssues(prev => prev.filter(i => i._id !== issue._id));
                        fetch('http://localhost:5000/api/issues', { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
                          .then(r=>r.json())
                          .then(all=>{ if (Array.isArray(all)) setIssues((all||[]).filter(i=>i.building && i.building._id===selectedBuilding._id)); });
                      }
                    } catch(_) {}
                  }}>Prosledi šefu</button>
                  <button className="btn-flat btn-flat-outline" onClick={async()=>{
                    if(!window.confirm('Odbiti ovaj kvar?')) return;
                    try {
                      const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/triage`, { method:'PATCH', headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')}, body: JSON.stringify({ action: 'reject' }) });
                      if (res.ok) {
                        setIssues(prev => prev.filter(i => i._id !== issue._id));
                        fetch('http://localhost:5000/api/issues', { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
                          .then(r=>r.json())
                          .then(all=>{ if (Array.isArray(all)) setIssues((all||[]).filter(i=>i.building && i.building._id===selectedBuilding._id)); });
                      }
                    } catch(_) {}
                  }}>Odbij</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============= BULLETIN BOARD SUBVIEW =============
  if (tab === 'buildings' && viewMode === 'bulletin') {
    const noteColors = ['yellow','pink','green','blue','purple','orange','lime','cyan','rose','violet'];
    const combined = [
      ...notices.map(n => ({ ...n, _kind: 'notice' })),
      ...polls.map(p => ({ ...p, _kind: 'poll' }))
    ].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    const HEX = { yellow:'#FEF08A', pink:'#FBCFE8', green:'#BBF7D0', blue:'#BAE6FD', purple:'#E9D5FF', orange:'#FED7AA', lime:'#ECFCCB', cyan:'#CFFAFE', rose:'#FFE4E6', violet:'#DDD6FE' };
    const darken = (hex, amt=0.35) => {
      let h = hex.replace('#','');
      if (h.length===3) h = h.split('').map(c=>c+c).join('');
      const num = parseInt(h,16);
      let r=(num>>16)&255, g=(num>>8)&255, b=num&255;
      r=Math.max(0,Math.round(r*(1-amt))); g=Math.max(0,Math.round(g*(1-amt))); b=Math.max(0,Math.round(b*(1-amt)));
      return '#'+(1<<24 | (r<<16)|(g<<8)|b).toString(16).slice(1);
    };
    return (
      <div className="card" style={{padding:18}}>
        <BackBar />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
          <h3 style={{marginTop:0,marginBottom:0}}>Oglasna tabla</h3>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-flat btn-flat-primary" onClick={()=>setShowNoticeModal(true)}>Kreiraj obaveštenje</button>
            <button className="btn-flat btn-flat-outline" onClick={()=>setShowPollForm(true)}>Kreiraj anketu</button>
          </div>
        </div>
        <div className="postit-grid" style={{marginTop:16}}>
          {combined.map((item,i)=>{
            const color = noteColors[i % noteColors.length];
            if (item._kind === 'notice') {
              const base = HEX[color] || '#ffffff';
              // Fallback: treat notice as manager-authored if current user is manager and matches author when authorRole missing
              const isMgr = item.authorRole === 'manager' || (
                user && user.role === 'manager' && item.author && (String(item.author) === String(user._id) || item.authorName === user.username)
              );
              // Lighter outline (few shades darker than base)
              const outlineColor = isMgr ? darken(base,0.25) : 'transparent';
              return (
                <div
                  key={item._id}
                  className={`postit ${color}`}
                  style={isMgr ? {
                    border:`2px solid ${outlineColor}`
                  } : {}}
                >
                  <div className="meta" style={{fontSize:12}}>{new Date(item.createdAt).toLocaleDateString()}</div>
                  <div className="title">Obaveštenje</div>
                  <div>{item.content}</div>
                  <div className="meta" style={{marginTop:6, fontWeight:isMgr?'600':'normal'}}>{item.authorName || 'Upravnik'}{isMgr?' • Upravnik':''}</div>
                  <button
                    className="btn-flat btn-flat-outline"
                    style={{marginTop:8,fontSize:12,padding:'4px 8px'}}
                    onClick={()=>handleDeleteNotice(item._id)}
                  >Obriši</button>
                </div>
              );
            } else {
              const p = item; // poll
              const voteCounts = p.options.map(opt => p.votes.filter(v=>v.option===opt).length);
              const data = p.options.map((opt,idx)=>({label:opt,value:voteCounts[idx]}));
              const maxVotes = Math.max(0,...voteCounts);
              const leadingOptions = p.options.filter((opt,idx)=>voteCounts[idx]===maxVotes && maxVotes>0);
              const isClosed = !!p.closedAt;
              const base = HEX[color] || '#ffffff';
              const outlineColor = darken(base,0.25); // lighter darken for subtle outline
              return (
                <div
                  key={p._id}
                  className={`postit ${color}`}
                  style={{
                    border:`2px solid ${outlineColor}`
                  }}
                >
                  <div className="title">Anketa</div>
                  <div style={{marginBottom:6}}>{p.question}</div>
                  <PieChart data={data} size={120} />
                  <div className="meta">{p.votes.length} glas{p.votes.length===1?'':'ova'}</div>
                  <div style={{marginTop:6,fontSize:12,fontWeight:600}}>
                    {isClosed ? (
                      leadingOptions.length===0 ? 'Zatvorena • Nema glasova' : `Zatvorena • Pobednik${leadingOptions.length>1?'i':''}: ${leadingOptions.join(', ')}`
                    ) : (
                      leadingOptions.length===0 ? 'Još nema glasova' : (leadingOptions.length>1 ? `Nerešeno: ${leadingOptions.join(', ')}` : `Vodi: ${leadingOptions[0]}`)
                    )}
                  </div>
                  {!isClosed && (
                    <button
                      className="btn-flat btn-flat-outline"
                      style={{marginTop:8,fontSize:12,padding:'4px 8px'}}
                      onClick={()=>closePoll(p._id)}
                    >Zatvori anketu</button>
                  )}
                </div>
              );
            }
          })}
          {combined.length===0 && <div className="muted">Nema stavki na oglasnoj tabli.</div>}
        </div>
        {showNoticeModal && (
          <Modal title="Novo obaveštenje" onClose={()=>setShowNoticeModal(false)}>
            <form onSubmit={handlePostNotice} style={{display:'grid',gap:12}}>
              <textarea rows={4} placeholder="Podelite obaveštenje o zgradi..." value={noticeContent} onChange={e=>setNoticeContent(e.target.value)} />
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type="submit" className="btn-flat btn-flat-primary">Objavi obaveštenje</button>
                <button type="button" className="btn-flat btn-flat-outline" onClick={()=>{setNoticeContent('');setShowNoticeModal(false);}}>Otkaži</button>
              </div>
            </form>
            {noticeMsg && <div style={{marginTop:8,fontSize:13}}>{noticeMsg}</div>}
          </Modal>
        )}
        {showPollForm && (
          <Modal title="Nova anketa" onClose={()=>setShowPollForm(false)}>
            <form onSubmit={createPoll} style={{display:'grid',gap:12}}>
              <input type="text" placeholder="Pitanje za anketu" value={pollQuestion} onChange={e=>setPollQuestion(e.target.value)} />
              <div style={{display:'grid',gap:8}}>
                {pollOptions.map((opt,idx)=>(
                  <div key={idx} style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input
                      type="text"
                      placeholder={`Opcija ${idx+1}`}
                      value={opt}
                      onChange={e=>updatePollOption(idx,e.target.value)}
                      style={{flex:1}}
                    />
                    {pollOptions.length>2 && (
                      <button type="button" className="btn-flat btn-flat-outline" style={{fontSize:12}} onClick={()=>removePollOption(idx)}>Ukloni</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type="button" className="btn-flat btn-flat-outline" disabled={pollOptions.length>=7} onClick={addPollOption}>Dodaj opciju</button>
                <button type="submit" className="btn-flat btn-flat-primary">Kreiraj anketu</button>
                <button type="button" className="btn-flat btn-flat-outline" onClick={()=>{setShowPollForm(false);}}>Otkaži</button>
              </div>
              <div className="muted" style={{fontSize:12}}>Opcije: {pollOptions.length} / 7</div>
            </form>
            {message && <div style={{marginTop:8,fontSize:13}}>{message}</div>}
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="card"><div className="muted">Nepodržan prikaz.</div></div>
  );
  // (Old dashboard code removed in simplified design)
}

// Add Apartment Form component
function _AddApartmentForm({ buildingId, onApartmentCreated }) {
  const [unitNumber, setUnitNumber] = useState('');
  const [address, setAddress] = useState('');
  const [numPeople, setNumPeople] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      setError('Broj stana je obavezan.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${buildingId}/apartments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ unitNumber, address, numPeople: numPeople ? Number(numPeople) : undefined })
      });
      const data = await res.json();
      if (res.ok) {
        setUnitNumber('');
        setAddress('');
        setNumPeople('');
        if (onApartmentCreated) onApartmentCreated(data);
      } else {
        setError(data.message || 'Kreiranje stana neuspelo.');
      }
    } catch (err) {
      setError('Greška pri kreiranju stana.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <h4>Dodaj stan</h4>
      <input
        type="text"
        placeholder="Broj stana"
        value={unitNumber}
        onChange={e => setUnitNumber(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Adresa (opciono)"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Broj ljudi (opciono)"
        value={numPeople}
        onChange={e => setNumPeople(e.target.value)}
        min={1}
      />
      <button type="submit" disabled={loading}>Dodaj stan</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}

export default ManagerDashboard;
