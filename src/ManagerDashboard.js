import React, { useState, useEffect } from 'react';
import ManagerProfile from './ManagerProfile';
import PieChart from './components/PieChart';
import Modal from './components/Modal';

function ManagerDashboard({ user, activeTab = 'home' }) {
  // Bulk apartment creation state
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkFloors, setBulkFloors] = useState('');
  const [bulkUnits, setBulkUnits] = useState('');
  const [bulkStartNumber, setBulkStartNumber] = useState('1');
  const [bulkError, setBulkError] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Bulk create handler
  const handleBulkCreate = async (e) => {
    e.preventDefault();
    setBulkError('');
    setBulkLoading(true);
    // Parse floors and units per floor
    let floors = parseInt(bulkFloors);
    if (isNaN(floors) || floors < 1) {
      setBulkError('Enter a valid number of floors.');
      setBulkLoading(false);
      return;
    }
    let startNumber = parseInt(bulkStartNumber);
    if (isNaN(startNumber) || startNumber < 1) {
      setBulkError('Enter a valid starting apartment number.');
      setBulkLoading(false);
      return;
    }
    // Accept comma-separated units per floor (e.g. 3,4,5)
    let unitsArr = bulkUnits.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (unitsArr.length === 0) {
      setBulkError('Enter units per floor (comma-separated, e.g. 3,4,5).');
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
        setBulkError(data.message || 'Bulk creation failed.');
      }
    } catch (err) {
      setBulkError('Bulk creation failed.');
    }
    setBulkLoading(false);
  };
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [message, setMessage] = useState('');
  const [globalPendingTenants, setGlobalPendingTenants] = useState([]);
  // Legacy single-select states (no longer used in the new table UI)
  const [assignBuilding, setAssignBuilding] = useState('');
  const [assignApartment, setAssignApartment] = useState('');
  const [assignBuildingApartments, setAssignBuildingApartments] = useState([]);
  // New: search and per-row selections for global pending tenants
  const [pendingQuery, setPendingQuery] = useState('');
  const [assignRows, setAssignRows] = useState({}); // { [tenantId]: { buildingId, apartmentId } }
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
  const [noticesLoading, setNoticesLoading] = useState(false);
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
    if (st === 'open') return 'Reported';
    if (st === 'in progress') return 'In progress';
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
          setBuildings(data);
          // Auto-select first building to avoid double selection UX
          if (!selectedBuilding && Array.isArray(data) && data.length > 0) {
            setSelectedBuilding(data[0]);
          }
        }
        else setMessage(data.message || 'Failed to load buildings.');

        // No global pending tenants endpoint - will filter on client side when needed
        setGlobalPendingTenants([]);

        // Load associates list
        try {
          const resAssoc = await fetch('http://localhost:5000/api/associates', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
          });
          const assocData = await resAssoc.json();
          if (resAssoc.ok) setAssociates(assocData);
        } catch (_) {}
      } catch (err) {
        setMessage('Error loading buildings or pending tenants.');
      }
    }
    fetchBuildingsAndPending();
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
        if (res.ok) setAssignBuildingApartments(data);
        else setAssignBuildingApartments([]);
      } catch (_) {
        setAssignBuildingApartments([]);
      }
    }
    fetchAssignApts();
  }, [assignBuilding]);

  // Helper: ensure apartments for a building are cached
  const ensureAptsInCache = async (buildingId) => {
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
        else setMessage(apartmentsData.message || 'Failed to load apartments.');

        const resTen = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const tenantsData = await resTen.json();
        if (resTen.ok) setTenants(tenantsData);
        else setMessage(tenantsData.message || 'Failed to load tenants.');

        // No pending tenants endpoint - will show all tenants
        setPendingTenants([]);

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
          setIssueError(issuesData.message || 'Failed to load issues.');
        }
        setIssueLoading(false);
      } catch (err) {
        setMessage('Error loading apartments/tenants.');
      }
    }
    fetchApartmentsAndTenants();
  }, [selectedBuilding]);

  // Assign tenant to apartment (can be used for global assignment)
  const assignTenant = async (tenantId, apartmentId, buildingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ apartmentId, buildingId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Tenant assigned successfully.');
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
      } else setMessage(data.message || 'Assignment failed.');
    } catch (err) {
      setMessage('Assignment failed.');
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
      if (!res.ok) { setMessage(data.message || 'Approval failed.'); return; }
      setMessage('Tenant approved.');
      // Refresh tenants for current building
      if (selectedBuilding) {
        fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
          .then(r=>r.json()).then(setTenants);
      }
    } catch (_) {
      setMessage('Approval failed.');
    }
  };

  const deleteTenant = async (tenantId) => {
    if (!window.confirm('Delete tenant? This cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}`, {
        method:'DELETE',
        headers:{'Authorization':'Bearer '+localStorage.getItem('token')}
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { setMessage(data.message || 'Delete failed.'); return; }
      setMessage('Tenant deleted.');
      if (selectedBuilding) {
        fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
          .then(r=>r.json()).then(setTenants);
      }
    } catch (_) {
      setMessage('Delete failed.');
    }
  };

  // Create a new poll
  const createPoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) {
      setMessage('Poll question is required.');
      return;
    }
    // Prepare options (trim and remove empties)
    const options = pollOptions.map(o => (o || '').trim()).filter(Boolean);
    if (options.length < 2) {
      setMessage('Please provide at least 2 options.');
      return;
    }
    if (options.length > 7) {
      setMessage('Maximum 7 options allowed.');
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
        setMessage('Poll created.');
      } else {
        setMessage(data.message || 'Failed to create poll.');
      }
    } catch (err) {
      setMessage('Failed to create poll.');
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
        setMessage('Poll closed.');
      } else {
        const data = await res.json().catch(()=>({}));
        setMessage(data.message || 'Failed to close poll.');
      }
    } catch (_) {
      setMessage('Failed to close poll.');
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
      setMessage('At least 2 options are required.');
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  // Managers do not vote on polls; display results only.

  const handlePostNotice = async (e) => {
    e.preventDefault();
    setNoticeMsg('');
    if (!noticeContent.trim()) { setNoticeMsg('Content required.'); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ content: noticeContent })
      });
      const data = await res.json();
      if (res.ok) {
        setNoticeMsg('Notice posted.');
        setNoticeContent('');
        // Refresh
        const resNotices = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/notices`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const noticesData = await resNotices.json();
        if (resNotices.ok && Array.isArray(noticesData)) setNotices(noticesData);
      } else {
        setNoticeMsg(data.message || 'Failed to post.');
      }
    } catch (_) {
      setNoticeMsg('Failed to post.');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notices/${noticeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { setNoticeMsg(data.message || 'Delete failed'); return; }
      // Refresh
      const resNotices = await fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/notices`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const noticesData = await resNotices.json();
      if (resNotices.ok && Array.isArray(noticesData)) setNotices(noticesData);
      setNoticeMsg('Notice deleted.');
    } catch (_) {
      setNoticeMsg('Delete failed');
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
        <h2 style={{margin:0}}>Home</h2>
        <div className="muted" style={{marginTop:8}}>Select "Buildings" to manage your properties.</div>
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
            placeholder="Pretraži po imenu ili adresi..."
            value={buildingSearch}
            onChange={e=>setBuildingSearch(e.target.value)}
            style={{padding:'10px 14px',minWidth:300,border:'1px solid #d0d7de',borderRadius:6,fontSize:14}}
          />
          <div className="muted" style={{fontSize:14}}>{filteredBuildings.length} od {buildings.length} zgrada</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:24}}>
          {filteredBuildings.map(b => (
            <div key={b._id} style={{border:'1px solid #e1e4e8',borderRadius:8,overflow:'hidden',background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',transition:'box-shadow 0.2s'}}>
              <div style={{height:200,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {b.imageUrl && b.imageUrl.trim() ? (
                  <img src={b.imageUrl} alt={b.name || 'Building'} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                ) : (
                  <div style={{fontSize:64,color:'rgba(255,255,255,0.3)'}}>🏢</div>
                )}
              </div>
              <div style={{padding:20,flexGrow:1,display:'flex',flexDirection:'column',gap:12}}>
                {(b.name && b.name.trim()) && <div style={{fontSize:18,fontWeight:600,color:'#24292e'}}>{b.name}</div>}
                <div>
                  <div className="muted" style={{fontSize:12,marginBottom:4}}>Lokacija:</div>
                  <div style={{fontSize:14,color:'#586069'}}>{b.address}</div>
                </div>
                <div>
                  <div className="muted" style={{fontSize:12,marginBottom:4}}>Broj stanova:</div>
                  <div style={{fontSize:24,fontWeight:700,color:'#0366d6'}}>{b.apartmentCount || 0}</div>
                </div>
              </div>
              <div style={{borderTop:'1px solid #e1e4e8'}}>
                {['Building details','Issues','Bulletin Board'].map((lbl,idx) => {
                  const modeMap = {0:'tenants',1:'issues',2:'bulletin'};
                  return (
                    <button 
                      key={lbl} 
                      style={{
                        width:'100%',
                        background:'#fff',
                        border:'none',
                        borderBottom: idx===2?'none':'1px solid #e1e4e8',
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
            <div style={{textAlign:'center',padding:'60px 20px',color:'#586069',gridColumn:'1/-1'}}>
              <div style={{fontSize:48,marginBottom:16}}>🏢</div>
              <div style={{fontSize:16}}>Nema zgrada za prikaz</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ensure data for selected building for subviews (existing effect handles fetch)
  if (!selectedBuilding) {
    return <div className="card"><div className="muted">Select a building from list.</div></div>;
  }

  // Back bar
  const BackBar = () => (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
      <button className="btn-flat btn-flat-outline" onClick={() => setViewMode('list')}>← Back to Buildings</button>
      <h2 style={{margin:0,fontSize:20}}>{selectedBuilding.name || selectedBuilding.address}</h2>
    </div>
  );

  // ============= TENANTS SUBVIEW =============
  if (tab === 'buildings' && viewMode === 'tenants') {
    return (
      <div className="card" style={{padding:18}}>
        <BackBar />
        <h3 style={{marginTop:0}}>Tenants</h3>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}}>
          <input
            type="text"
            placeholder="Search tenants (name, email, unit, username)..."
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
              <th style={{padding:'8px 6px'}}>Name</th>
              <th style={{padding:'8px 6px'}}>Unit</th>
              <th style={{padding:'8px 6px'}}>Email</th>
              <th style={{padding:'8px 6px'}}>Status</th>
              <th style={{padding:'8px 6px'}}>Actions</th>
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
                <td style={{padding:'8px 6px'}}>{t.apartment?`Unit ${t.apartment.unitNumber}`:'-'}</td>
                <td style={{padding:'8px 6px'}}>{t.email}</td>
                <td style={{padding:'8px 6px'}}><span className={`pill ${t.status==='active'?'good':'warn'}`}>{t.status}</span></td>
                <td style={{padding:'8px 6px'}}>
                  {t.status==='active' && (
                    <button
                      className="btn-flat btn-flat-outline"
                      style={{fontSize:12,padding:'4px 8px'}}
                      onClick={async()=>{
                        if(!window.confirm('Delete tenant and free unit?')) return;
                        try {
                          const res = await fetch(`http://localhost:5000/api/tenants/${t._id}`, { method:'DELETE', headers:{'Authorization':'Bearer '+localStorage.getItem('token')} });
                          if (res.ok) {
                            // refresh tenants & apartments & pending
                            fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/tenants`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} }).then(r=>r.json()).then(setTenants);
                            fetch(`http://localhost:5000/api/buildings/${selectedBuilding._id}/apartments`, { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} }).then(r=>r.json()).then(a=>{
                              setApartments(a);
                              setApartmentsCache(prev=>({...prev,[selectedBuilding._id]:a}));
                            });
                          }
                        } catch(_) {}
                      }}
                    >Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {tenants.length===0 && <tr><td colSpan={4} style={{padding:'12px 6px'}} className="muted">No tenants.</td></tr>}
          </tbody>
        </table>
        <div style={{marginTop:32}}>
          <h3 style={{margin:'0 0 8px'}}>Pending Claims</h3>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
            <thead>
              <tr style={{textAlign:'left',borderBottom:'1px solid #e2e8f0'}}>
                <th style={{padding:'8px 6px'}}>Name</th>
                <th style={{padding:'8px 6px'}}>Claimed Unit</th>
                <th style={{padding:'8px 6px'}}>Email</th>
                <th style={{padding:'8px 6px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTenants.map(p => (
                <tr key={p._id} style={{borderBottom:'1px solid #f1f5f9'}}>
                  <td style={{padding:'8px 6px'}}>{p.firstName} {p.lastName}</td>
                  <td style={{padding:'8px 6px'}}>{p.requestedApartment? `Unit ${p.requestedApartment.unitNumber}` : '-'}</td>
                  <td style={{padding:'8px 6px'}}>{p.email}</td>
                  <td style={{padding:'8px 6px',display:'flex',gap:8}}>
                    <button className="btn-flat btn-flat-primary" onClick={()=>approveTenant(p._id)}>Approve</button>
                    <button className="btn-flat btn-flat-outline" onClick={()=>deleteTenant(p._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {pendingTenants.length===0 && <tr><td colSpan={4} style={{padding:'12px 6px'}} className="muted">No pending claims.</td></tr>}
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
        <h3 style={{marginTop:0}}>Building Issues</h3>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',margin:'6px 0 16px'}}>
          <button className={`btn-flat ${issueUrgency==='all'?'btn-flat-primary':'btn-flat-outline'}`} onClick={()=>setIssueUrgency('all')}>All</button>
          <button className={`btn-flat ${issueUrgency==='urgent'?'btn-flat-primary':'btn-flat-outline'}`} onClick={()=>setIssueUrgency('urgent')}>Urgent</button>
          <button className={`btn-flat ${issueUrgency==='not-urgent'?'btn-flat-primary':'btn-flat-outline'}`} onClick={()=>setIssueUrgency('not-urgent')}>Not urgent</button>
          <div className="muted" style={{marginLeft:8,fontSize:12}}>{filtered.length} of {triage.length}</div>
        </div>
        {filtered.length===0 && <div className="muted">No issues to triage.</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {filtered.map(issue => (
            <div key={issue._id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,boxShadow:'0 4px 14px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:24,fontWeight:700, textAlign:'center', lineHeight:1.2, marginBottom:8}}>{issue.title}</div>
              <div style={{fontWeight:700, textAlign:'center'}}>Priority:</div>
              <div style={{textAlign:'center', marginBottom:10}}>{issue.priority==='high' ? 'High' : issue.priority==='medium' ? 'Medium' : 'Low'}</div>
              <div style={{fontWeight:600, marginTop:6}}>Description:</div>
              <div style={{color:'#334155'}}>{issue.description}</div>
              <div style={{fontWeight:600, marginTop:10}}>Location:</div>
              <div className="muted">{issue.building ? (issue.building.name ? `${issue.building.name}, ${issue.building.address}` : issue.building.address) : ''}</div>
              <div style={{fontWeight:600, marginTop:6}}>Unit:</div>
              <div className="muted">{issue.apartment ? issue.apartment.unitNumber : '-'}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginTop:12,flexWrap:'wrap'}}>
                <span className={statusClass(issue.status)}>{statusLabel(issue.status)}</span>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <select value={assignPick[issue._id] || ''} onChange={e => setAssignPick(prev => ({ ...prev, [issue._id]: e.target.value }))} style={{padding:'6px 8px'}}>
                    <option value="">Select associate</option>
                    {associates.map(a => (
                      <option key={a.username} value={a.username}>{`${a.firstName || ''} ${a.lastName || ''}`.trim()}{a.company?` — ${a.company}`:''}</option>
                    ))}
                  </select>
                  <button className="btn-flat btn-flat-primary" disabled={!assignPick[issue._id]} onClick={async()=>{
                    try {
                      const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/assign`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')}, body: JSON.stringify({ assignee: assignPick[issue._id] }) });
                      if (res.ok) {
                        // Optimistically remove from triage list
                        setIssues(prev => prev.filter(i => i._id !== issue._id));
                        // Refresh in background to keep in sync
                        fetch('http://localhost:5000/api/issues', { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
                          .then(r=>r.json())
                          .then(all=>{ if (Array.isArray(all)) setIssues((all||[]).filter(i=>i.building && i.building._id===selectedBuilding._id)); });
                      }
                    } catch(_) {}
                  }}>Assign</button>
                  <button className="btn-flat btn-flat-outline" onClick={async()=>{
                    try {
                      const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/forward`, { method:'POST', headers:{'Authorization':'Bearer '+localStorage.getItem('token')} });
                      if (res.ok) {
                        setIssues(prev => prev.filter(i => i._id !== issue._id));
                        fetch('http://localhost:5000/api/issues', { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
                          .then(r=>r.json())
                          .then(all=>{ if (Array.isArray(all)) setIssues((all||[]).filter(i=>i.building && i.building._id===selectedBuilding._id)); });
                      }
                    } catch(_) {}
                  }}>Forward to director</button>
                  <button className="btn-flat btn-flat-outline" onClick={async()=>{
                    if(!window.confirm('Reject this issue?')) return;
                    try {
                      const res = await fetch(`http://localhost:5000/api/issues/${issue._id}/status`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')}, body: JSON.stringify({ status:'rejected' }) });
                      if (res.ok) {
                        setIssues(prev => prev.filter(i => i._id !== issue._id));
                        fetch('http://localhost:5000/api/issues', { headers:{'Authorization':'Bearer '+localStorage.getItem('token')} })
                          .then(r=>r.json())
                          .then(all=>{ if (Array.isArray(all)) setIssues((all||[]).filter(i=>i.building && i.building._id===selectedBuilding._id)); });
                      }
                    } catch(_) {}
                  }}>Reject issue</button>
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
          <h3 style={{marginTop:0,marginBottom:0}}>Bulletin Board</h3>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-flat btn-flat-primary" onClick={()=>setShowNoticeModal(true)}>New Notice</button>
            <button className="btn-flat btn-flat-outline" onClick={()=>setShowPollForm(true)}>New Poll</button>
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
                    border:`2px solid ${outlineColor}`,
                    boxShadow:`0 4px 12px rgba(0,0,0,0.08)`
                  } : { boxShadow:'0 8px 18px rgba(0,0,0,0.08)'}}
                >
                  <div className="meta" style={{fontSize:12}}>{new Date(item.createdAt).toLocaleDateString()}</div>
                  <div className="title">Notice</div>
                  <div>{item.content}</div>
                  <div className="meta" style={{marginTop:6, fontWeight:isMgr?'600':'normal'}}>{item.authorName || 'Manager'}{isMgr?' • Manager':''}</div>
                  <button
                    className="btn-flat btn-flat-outline"
                    style={{marginTop:8,fontSize:12,padding:'4px 8px'}}
                    onClick={()=>handleDeleteNotice(item._id)}
                  >Delete</button>
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
                    border:`2px solid ${outlineColor}`,
                    boxShadow:'0 4px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  <div className="title">Poll</div>
                  <div style={{marginBottom:6}}>{p.question}</div>
                  <PieChart data={data} size={120} />
                  <div className="meta">{p.votes.length} vote{p.votes.length===1?'':'s'}</div>
                  <div style={{marginTop:6,fontSize:12,fontWeight:600}}>
                    {isClosed ? (
                      leadingOptions.length===0 ? 'Closed • No votes' : `Closed • Winner${leadingOptions.length>1?'s':''}: ${leadingOptions.join(', ')}`
                    ) : (
                      leadingOptions.length===0 ? 'No votes yet' : (leadingOptions.length>1 ? `Tie: ${leadingOptions.join(', ')}` : `Leading: ${leadingOptions[0]}`)
                    )}
                  </div>
                  {!isClosed && (
                    <button
                      className="btn-flat btn-flat-outline"
                      style={{marginTop:8,fontSize:12,padding:'4px 8px'}}
                      onClick={()=>closePoll(p._id)}
                    >Close Poll</button>
                  )}
                </div>
              );
            }
          })}
          {combined.length===0 && <div className="muted">No bulletin items.</div>}
        </div>
        {showNoticeModal && (
          <Modal title="New Notice" onClose={()=>setShowNoticeModal(false)}>
            <form onSubmit={handlePostNotice} style={{display:'grid',gap:12}}>
              <textarea rows={4} placeholder="Share a building notice..." value={noticeContent} onChange={e=>setNoticeContent(e.target.value)} />
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type="submit" className="btn-flat btn-flat-primary">Post Notice</button>
                <button type="button" className="btn-flat btn-flat-outline" onClick={()=>{setNoticeContent('');setShowNoticeModal(false);}}>Cancel</button>
              </div>
            </form>
            {noticeMsg && <div style={{marginTop:8,fontSize:13}}>{noticeMsg}</div>}
          </Modal>
        )}
        {showPollForm && (
          <Modal title="New Poll" onClose={()=>setShowPollForm(false)}>
            <form onSubmit={createPoll} style={{display:'grid',gap:12}}>
              <input type="text" placeholder="Poll question" value={pollQuestion} onChange={e=>setPollQuestion(e.target.value)} />
              <div style={{display:'grid',gap:8}}>
                {pollOptions.map((opt,idx)=>(
                  <div key={idx} style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input
                      type="text"
                      placeholder={`Option ${idx+1}`}
                      value={opt}
                      onChange={e=>updatePollOption(idx,e.target.value)}
                      style={{flex:1}}
                    />
                    {pollOptions.length>2 && (
                      <button type="button" className="btn-flat btn-flat-outline" style={{fontSize:12}} onClick={()=>removePollOption(idx)}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type="button" className="btn-flat btn-flat-outline" disabled={pollOptions.length>=7} onClick={addPollOption}>Add Option</button>
                <button type="submit" className="btn-flat btn-flat-primary">Create Poll</button>
                <button type="button" className="btn-flat btn-flat-outline" onClick={()=>{setShowPollForm(false);}}>Cancel</button>
              </div>
              <div className="muted" style={{fontSize:12}}>Options: {pollOptions.length} / 7</div>
            </form>
            {message && <div style={{marginTop:8,fontSize:13}}>{message}</div>}
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="card"><div className="muted">Unsupported view.</div></div>
  );
  // (Old dashboard code removed in simplified design)
}

// Add Apartment Form component
function AddApartmentForm({ buildingId, onApartmentCreated }) {
  const [unitNumber, setUnitNumber] = useState('');
  const [address, setAddress] = useState('');
  const [numPeople, setNumPeople] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      setError('Unit number is required.');
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
        setError(data.message || 'Failed to create apartment.');
      }
    } catch (err) {
      setError('Error creating apartment.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <h4>Add Apartment/Unit</h4>
      <input
        type="text"
        placeholder="Unit Number"
        value={unitNumber}
        onChange={e => setUnitNumber(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Address (optional)"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Number of People (optional)"
        value={numPeople}
        onChange={e => setNumPeople(e.target.value)}
        min={1}
      />
      <button type="submit" disabled={loading}>Add Apartment</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}

export default ManagerDashboard;
