/* eslint-disable max-lines, max-lines-per-function, complexity, no-console */
import React, { useState, useEffect } from 'react';

function DirectorDashboard({ activeTab = 'zgrade' }) {
  const tab = activeTab || 'zgrade';
  const token = localStorage.getItem('token');
  const [buildings, setBuildings] = useState([]);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingAddress, setNewBuildingAddress] = useState('');
  const [newBuildingImage, setNewBuildingImage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [managers, setManagers] = useState([]);
  const [_showAssignModal, setShowAssignModal] = useState(false);
  const [_selectedBuilding, setSelectedBuilding] = useState(null);
  const [issues, setIssues] = useState([]);
  const [associates, setAssociates] = useState([]);
  const [showAssignIssueModal, setShowAssignIssueModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [issueSearchQuery, setIssueSearchQuery] = useState('');
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [managerStatusFilter, setManagerStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [hoveredManager, setHoveredManager] = useState(null);
  const [managerBuildings, setManagerBuildings] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceSortOrder, setInvoiceSortOrder] = useState('newest');
  const [associateSearchQuery, setAssociateSearchQuery] = useState('');
  const [associateStatusFilter, setAssociateStatusFilter] = useState('all');
  const [userProfile, setUserProfile] = useState({ budget: 150000 }); // Director budget - enough for all invoices

  useEffect(() => {
    if (tab !== 'zgrade' || !token) return;
    setLoading(true);
    fetch('http://localhost:5000/api/buildings', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(data => {
        console.log('GET /api/buildings response:', data);
        if (Array.isArray(data.data)) setBuildings(data.data);
        else {
          console.error('GET buildings error:', data);
          setError(data.message || 'Greška pri učitavanju zgrada');
        }
      })
      .catch(err => {
        console.error('GET buildings fetch error:', err);
        setError('Greška pri učitavanju zgrada');
      })
      .finally(() => setLoading(false));
  }, [token, tab, success]);

  useEffect(() => {
    if ((tab !== 'upravnici' && tab !== 'zgrade') || !token) return;
    fetch('http://localhost:5000/api/users?role=manager', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(data => {
        console.log('GET /api/users?role=manager response:', data);
        if (Array.isArray(data.data)) {
          setManagers(data.data);
          // Fetch buildings for each manager
          data.data.forEach(manager => {
            fetch(`http://localhost:5000/api/buildings?managerId=${manager._id}`, {
              headers: { Authorization: 'Bearer ' + token }
            })
              .then(r => r.json())
              .then(buildings => {
                if (Array.isArray(buildings.data)) {
                  setManagerBuildings(prev => ({
                    ...prev,
                    [manager._id]: buildings.data
                  }));
                }
              })
              .catch(err => console.error('GET manager buildings error:', err));
          });
        }
      })
      .catch(err => console.error('GET managers fetch error:', err));
  }, [token, tab, success]);

  useEffect(() => {
    if (tab !== 'kvarovi' || !token) return;
    setLoading(true);
    fetch('http://localhost:5000/api/issues', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(data => {
        console.log('GET /api/issues response:', data);
        if (Array.isArray(data.data)) setIssues(data.data);
        else {
          console.error('GET issues error:', data);
          setError(data.message || 'Greška pri učitavanju kvarova');
        }
      })
      .catch(err => {
        console.error('GET issues fetch error:', err);
        setError('Greška pri učitavanju kvarova');
      })
      .finally(() => setLoading(false));

    // Fetch associates for assignment
    fetch('http://localhost:5000/api/users?role=associate&includeTest=true', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(data => {
        console.log('GET /api/users?role=associate response:', data);
        if (Array.isArray(data.data)) setAssociates(data.data);
      })
      .catch(err => console.error('GET associates fetch error:', err));
  }, [token, tab, success]);

  // Fetch associates for Saradnici tab
  useEffect(() => {
    if (tab !== 'saradnici' || !token) return;
    console.log('Fetching associates for Saradnici tab...');
    setLoading(true);
    fetch('http://localhost:5000/api/users?role=associate&includeTest=true', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(data => {
        console.log('GET /api/users?role=associate for Saradnici tab:', data);
        if (Array.isArray(data.data)) {
          setAssociates(data.data);
          console.log('Associates loaded:', data.data.length);
        }
      })
      .catch(err => console.error('GET associates fetch error:', err))
      .finally(() => setLoading(false));
  }, [token, tab, success]);

  useEffect(() => {
    if (tab !== 'dugovanja' || !token) return;
    setLoading(true);
    fetch('http://localhost:5000/api/invoices/unpaid', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(data => {
        console.log('GET /api/invoices/unpaid response:', data);
        if (data.data && Array.isArray(data.data)) {
          setInvoices(data.data);
        } else {
          console.error('GET invoices error:', data);
          setError(data.message || 'Greška pri učitavanju dugovanja');
        }
      })
      .catch(err => {
        console.error('GET invoices fetch error:', err);
        setError('Greška pri učitavanju dugovanja');
      })
      .finally(() => setLoading(false));
  }, [token, tab, success]);

  const handleCreateBuilding = async (e) => {
    e.preventDefault();
    if (!newBuildingAddress.trim()) {
      setError('Adresa je obavezna');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        address: newBuildingAddress.trim(),
        name: newBuildingName.trim() || '',
        imageUrl: newBuildingImage.trim() || ''
      };
      const res = await fetch('http://localhost:5000/api/buildings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('POST /api/buildings response:', res.status, data);
      if (res.ok) {
        setSuccess('Zgrada uspešno kreirana!');
        setNewBuildingName('');
        setNewBuildingAddress('');
        setNewBuildingImage('');
        setShowCreateForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('POST buildings error:', data);
        setError(data.message || 'Greška pri kreiranju zgrade');
      }
    } catch (err) {
      console.error('POST buildings fetch error:', err);
      setError('Greška pri kreiranju zgrade');
    } finally {
      setLoading(false);
    }
  };

  const filteredBuildings = buildings.filter(b => {
    // Building filter
    if (buildingFilter === 'no-manager' && b.manager) return false;
    if (buildingFilter === 'with-manager' && !b.manager) return false;
    // Search query
    const query = searchQuery.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(query)) ||
      (b.address && b.address.toLowerCase().includes(query)) ||
      (b.manager?.firstName && b.manager.firstName.toLowerCase().includes(query)) ||
      (b.manager?.lastName && b.manager.lastName.toLowerCase().includes(query))
    );
  });

  const filteredIssues = issues.filter(issue => {
    if (priorityFilter !== 'all') {
      if (priorityFilter === 'medium,low') {
        if (issue.priority !== 'medium' && issue.priority !== 'low') return false;
      } else if (issue.priority !== priorityFilter) return false;
    }
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (issueSearchQuery.trim()) {
      const query = issueSearchQuery.toLowerCase();
      const titleMatch = issue.title?.toLowerCase().includes(query);
      const descMatch = issue.description?.toLowerCase().includes(query);
      const apartmentMatch = issue.apartment?.number?.toString().includes(query);
      const creatorMatch = `${issue.createdBy?.firstName} ${issue.createdBy?.lastName}`.toLowerCase().includes(query);
      if (!titleMatch && !descMatch && !apartmentMatch && !creatorMatch) return false;
    }
    return true;
  });

  const _handleAssignManager = async (buildingId, managerId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/buildings/${buildingId}/assign-manager`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({ managerId })
      });
      const data = await res.json();
      if (res.ok) {
            setBuildings(buildings.map(b => b._id === buildingId ? data.data : b));
        setSuccess('Upravnik uspešno dodeljen');
        setTimeout(() => setSuccess(''), 3000);
        setShowAssignModal(false);
      } else {
        setError(data.message || 'Greška pri dodeli upravnika');
      }
    } catch (err) {
      console.error('Assign manager error:', err);
      setError('Greška pri dodeli upravnika');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setManagers(managers.filter(m => m._id !== userId));
        setSuccess('Korisnik uspešno obrisan');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Greška pri brisanju korisnika');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setError('Greška pri brisanju korisnika');
    } finally {
      setLoading(false);
    }
  };

  const _handleBulkDeleteTestUsers = async () => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete SVE test korisnike? (usernames: test*, names: Name123/Last123)')) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/users/bulk/test', {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
            setSuccess(`Obrisano: ${data.data?.deletedCount} test korisnika`);
        setTimeout(() => setSuccess(''), 3000);
        // Refresh managers list
        fetch('http://localhost:5000/api/users?role=manager', {
          headers: { Authorization: 'Bearer ' + token }
        })
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data.data)) setManagers(data.data);
          });
      } else {
        setError(data.message || 'Greška pri brisanju test korisnika');
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      setError('Greška pri brisanju test korisnika');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/users/${userId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setManagers(managers.map(m => m._id === userId ? { ...m, status: 'active' } : m));
        setSuccess('Korisnik uspešno odobren');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Greška pri odobravanju korisnika');
      }
    } catch (err) {
      console.error('Approve user error:', err);
      setError('Greška pri odobravanju korisnika');
    } finally {
      setLoading(false);
    }
  };



  const handleAssignIssue = async (issueId, action, assignedTo = null) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/issues/${issueId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ action, assignedTo })
      });
      const data = await res.json();
      if (res.ok) {
            setIssues(issues.map(i => i._id === issueId ? data.data : i));
        setSuccess(action === 'reject' ? 'Kvar odbijen' : 'Kvar uspešno dodeljen');
        setTimeout(() => setSuccess(''), 3000);
        setShowAssignIssueModal(false);
      } else {
        setError(data.message || 'Greška pri dodeli kvara');
      }
    } catch (err) {
      console.error('Assign issue error:', err);
      setError('Greška pri dodeli kvara');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    // Find the invoice to get the amount
    const invoice = invoices.flatMap(group => group.invoices).find(inv => inv._id === invoiceId);
    if (!invoice) {
      setError('Faktura nije pronađena');
      return;
    }
    
    if (userProfile.budget < invoice.amount) {
      setError(`Nemate dovoljno sredstava. Potrebno: ${invoice.amount.toLocaleString('sr-RS')} RSD, Dostupno: ${userProfile.budget.toLocaleString('sr-RS')} RSD`);
      return;
    }
    
    if (!window.confirm(`Da li ste sigurni da želite da platite fakturu od ${invoice.amount.toLocaleString('sr-RS')} RSD?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/pay`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        // Remove invoice from unpaid list
        setInvoices(invoices.map(group => ({
          ...group,
          invoices: group.invoices.filter(inv => inv._id !== invoiceId),
          total: group.total - invoice.amount
        })).filter(group => group.invoices.length > 0));
        
        // Update budget
        setUserProfile(prev => ({
          ...prev,
          budget: prev.budget - invoice.amount
        }));
        
        setSuccess('Faktura uspešno plaćena');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Greška pri označavanju fakture');
      }
    } catch (err) {
      console.error('Pay invoice error:', err);
      setError('Greška pri označavanju fakture');
    } finally {
      setLoading(false);
    }
  };

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

      {tab === 'zgrade' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#2c3e50' }}>Zgrade</h2>
              <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Ukupno zgrada: {buildings.length}</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                padding: '12px 24px',
                background: showCreateForm ? '#95a5a6' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {showCreateForm ? '✕ Otkaži' : '+ Nova zgrada'}
            </button>
          </div>

          {showCreateForm && (
            <div className="card" style={{
              padding: 30,
              marginBottom: 30
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: '#2c3e50' }}>Kreiraj novu zgradu</h3>
              <form onSubmit={handleCreateBuilding} style={{ display: 'grid', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#2c3e50' }}>Naziv (opciono)</label>
                  <input
                    type="text"
                    value={newBuildingName}
                    onChange={e => setNewBuildingName(e.target.value)}
                    placeholder="npr. Zgrada A"
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 15,
                      border: '1px solid #dee2e6',
                      borderRadius: 6,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#2c3e50' }}>Adresa *</label>
                  <input
                    type="text"
                    value={newBuildingAddress}
                    onChange={e => setNewBuildingAddress(e.target.value)}
                    placeholder="npr. Kneza Miloša 10"
                    required
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 15,
                      border: '1px solid #dee2e6',
                      borderRadius: 6,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#2c3e50' }}>URL slike (opciono)</label>
                  <input
                    type="url"
                    value={newBuildingImage}
                    onChange={e => setNewBuildingImage(e.target.value)}
                    placeholder="https://example.com/slika.jpg"
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 15,
                      border: '1px solid #dee2e6',
                      borderRadius: 6,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: 14,
                    background: loading ? '#95a5a6' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? 'Kreiranje...' : '✓ Kreiraj zgradu'}
                </button>
              </form>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pretraži zgrade po nazivu, adresi ili upravniku..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                border: '1px solid #dee2e6',
                borderRadius: 6,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Building Filter */}
          <div style={{ marginBottom: 24 }}>
            <select
              value={buildingFilter}
              onChange={e => setBuildingFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dee2e6',
                borderRadius: 6,
                fontSize: 14,
                background: 'white',
                color: '#2c3e50',
                cursor: 'pointer'
              }}
            >
              <option value="all">Sve zgrade</option>
              <option value="no-manager">Bez upravnika</option>
              <option value="with-manager">Sa upravnikom</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <p style={{ color: '#95a5a6', fontSize: 16 }}>Učitavanje zgrada...</p>
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 80,
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: 8, fontSize: 18 }}>
                {searchQuery ? 'Nema rezultata pretrage' : 'Nema kreiranih zgrada'}
              </h3>
              <p style={{ color: '#7f8c8d', fontSize: 14 }}>
                {searchQuery
                  ? 'Pokušajte sa drugačijim kriterijumima pretrage'
                  : 'Kliknite na dugme "Nova zgrada" da kreirate prvu zgradu'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 20
            }}>
              {filteredBuildings.map(building => (
                <div
                  key={building._id}
                  style={{
                    background: 'white',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: building.manager ? '1px solid #dee2e6' : '2px solid #c0392b',
                    boxShadow: building.manager ? 'none' : '0 0 0 1px rgba(192, 57, 43, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    height: 160,
                    background: building.imageUrl
                      ? 'url(' + building.imageUrl + ') center/cover'
                      : '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#95a5a6',
                    fontSize: 14,
                    fontWeight: 500
                  }}>
                    {!building.imageUrl && 'Zgrada'}
                  </div>
                  <div style={{ padding: 20 }}>
                    <h4 style={{
                      fontSize: 18,
                      fontWeight: 600,
                      margin: '0 0 8px 0',
                      color: '#2c3e50',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {building.name || 'Zgrada'}
                    </h4>
                    <p style={{
                      margin: '0 0 16px 0',
                      color: '#7f8c8d',
                      fontSize: 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {building.address}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 16
                    }}>
                      <div style={{
                        padding: 10,
                        background: '#f8f9fa',
                        borderRadius: 6,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#2c3e50' }}>
                          {building.apartmentCount || 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#95a5a6', marginTop: 2 }}>Stanovi</div>
                      </div>
                      <div style={{
                        padding: 10,
                        background: '#f8f9fa',
                        borderRadius: 6,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#2c3e50' }}>
                          {building.manager ? '✓' : '○'}
                        </div>
                        <div style={{ fontSize: 11, color: '#95a5a6', marginTop: 2 }}>Upravnik</div>
                      </div>
                    </div>
                    {building.manager ? (
                      <div style={{
                        padding: 10,
                        background: '#f8f9fa',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#2c3e50',
                        marginBottom: 10
                      }}>
                        {building.manager.firstName + ' ' + building.manager.lastName}
                      </div>
                    ) : (
                      <div style={{
                        padding: 10,
                        background: '#f8f9fa',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#7f8c8d',
                        marginBottom: 10
                      }}>
                        Upravnik nije dodeljen
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBuilding(building);
                        setShowAssignModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      {building.manager ? 'Promeni upravnika' : 'Dodeli upravnika'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'upravnici' && (
        <div>
          <div style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 20px 0', color: '#2c3e50' }}>Upravnici</h2>
            
            {/* Search Bar */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={managerSearchQuery}
                onChange={e => setManagerSearchQuery(e.target.value)}
                placeholder="Pretraži upravnike po imenu, prezimenu ili email-u..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: '1px solid #dee2e6',
                  borderRadius: 6,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <select
                  value={managerStatusFilter}
                  onChange={e => setManagerStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: 6,
                    fontSize: 14,
                    background: 'white',
                    color: '#2c3e50',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Svi statusi</option>
                  <option value="active">Aktivni</option>
                  <option value="pending">Na čekanju</option>
                </select>
              </div>
            </div>
          </div>

          {managers.filter(m => {
            // Status filter
            if (managerStatusFilter !== 'all' && m.status !== managerStatusFilter) return false;
            // Search filter
            if (managerSearchQuery.trim()) {
              const query = managerSearchQuery.toLowerCase();
              const nameMatch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(query);
              const emailMatch = m.email?.toLowerCase().includes(query);
              if (!nameMatch && !emailMatch) return false;
            }
            return true;
          }).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 80,
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: 8, fontSize: 18 }}>
                {managers.length === 0 ? 'Nema registrovanih upravnika' : 'Nema rezultata pretrage'}
              </h3>
              <p style={{ color: '#7f8c8d', fontSize: 14 }}>
                {managers.length === 0 ? 'Upravnici će se pojaviti ovde nakon registracije' : 'Pokušajte sa drugačijim kriterijumima pretrage'}
              </p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #dee2e6', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Ime i prezime</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Email</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Status</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Zgrade</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.filter(m => {
                    // Status filter
                    if (managerStatusFilter !== 'all' && m.status !== managerStatusFilter) return false;
                    // Search filter
                    if (managerSearchQuery.trim()) {
                      const query = managerSearchQuery.toLowerCase();
                      const nameMatch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(query);
                      const emailMatch = m.email?.toLowerCase().includes(query);
                      if (!nameMatch && !emailMatch) return false;
                    }
                    return true;
                  }).map(manager => (
                    <tr key={manager._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                      <td style={{ padding: 16, color: '#2c3e50', fontSize: 14 }}>
                        {manager.firstName} {manager.lastName}
                      </td>
                      <td style={{ padding: 16, color: '#7f8c8d', fontSize: 14 }}>{manager.email}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: '4px 12px',
                          background: manager.status === 'active' ? '#d4edda' : '#fff3cd',
                          color: manager.status === 'active' ? '#27ae60' : '#e67e22',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {manager.status === 'active' ? 'Aktivan' : 'Na čekanju'}
                        </span>
                      </td>
                      <td 
                        style={{ 
                          padding: 16, 
                          color: '#2c3e50', 
                          fontSize: 14,
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onMouseEnter={() => setHoveredManager(manager._id)}
                        onMouseLeave={() => setHoveredManager(null)}
                      >
                        <span style={{ textDecoration: 'underline', color: '#3498db' }}>
                          {manager.buildingCount || 0}
                        </span>
                        {hoveredManager === manager._id && managerBuildings[manager._id] && managerBuildings[manager._id].length > 0 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 16,
                            marginBottom: 8,
                            background: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: 6,
                            padding: 12,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: 200,
                            maxWidth: 300
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#2c3e50' }}>Zgrade:</div>
                            {managerBuildings[manager._id].map((building, idx) => (
                              <div key={building._id} style={{ fontSize: 13, color: '#7f8c8d', marginBottom: 4 }}>
                                {idx + 1}. {building.name || building.address}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 16 }}>
                        {manager.status === 'pending' && (
                          <button
                            onClick={() => handleApproveUser(manager._id)}
                            disabled={loading}
                            style={{
                              padding: '6px 16px',
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 13,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              marginRight: 8,
                              opacity: loading ? 0.6 : 1
                            }}
                          >
                            Odobri
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(manager._id)}
                          disabled={loading}
                          style={{
                            padding: '6px 16px',
                            background: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 13,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'saradnici' && (
        <div>
          <div style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 20px 0', color: '#2c3e50' }}>Saradnici</h2>
            
            {/* Search Bar */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={associateSearchQuery}
                onChange={e => setAssociateSearchQuery(e.target.value)}
                placeholder="Pretraži saradnike po imenu, prezimenu ili email-u..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: '1px solid #dee2e6',
                  borderRadius: 6,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <select
                  value={associateStatusFilter}
                  onChange={e => setAssociateStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: 6,
                    fontSize: 14,
                    background: 'white',
                    color: '#2c3e50',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Svi statusi</option>
                  <option value="active">Aktivni</option>
                  <option value="pending">Na čekanju</option>
                </select>
              </div>
            </div>
          </div>

          {associates.filter(a => {
            // Status filter
            if (associateStatusFilter !== 'all' && a.status !== associateStatusFilter) return false;
            // Search filter
            if (associateSearchQuery.trim()) {
              const query = associateSearchQuery.toLowerCase();
              const nameMatch = `${a.firstName} ${a.lastName}`.toLowerCase().includes(query);
              const emailMatch = a.email?.toLowerCase().includes(query);
              if (!nameMatch && !emailMatch) return false;
            }
            return true;
          }).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 80,
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: 8, fontSize: 18 }}>
                {associates.length === 0 ? 'Nema registrovanih saradnika' : 'Nema rezultata pretrage'}
              </h3>
              <p style={{ color: '#7f8c8d', fontSize: 14 }}>
                {associates.length === 0 ? 'Saradnici će se pojaviti ovde nakon registracije' : 'Pokušajte sa drugačijim kriterijumima pretrage'}
              </p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #dee2e6', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Ime i prezime</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Firma</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Telefon</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Email</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Status</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {associates.filter(a => {
                    // Status filter
                    if (associateStatusFilter !== 'all' && a.status !== associateStatusFilter) return false;
                    // Search filter
                    if (associateSearchQuery.trim()) {
                      const query = associateSearchQuery.toLowerCase();
                      const nameMatch = `${a.firstName} ${a.lastName}`.toLowerCase().includes(query);
                      const emailMatch = a.email?.toLowerCase().includes(query);
                      const companyMatch = a.company?.toLowerCase().includes(query);
                      if (!nameMatch && !emailMatch && !companyMatch) return false;
                    }
                    return true;
                  }).map(associate => (
                    <tr key={associate._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                      <td style={{ padding: 16, color: '#2c3e50', fontSize: 14 }}>
                        {associate.firstName} {associate.lastName}
                      </td>
                      <td style={{ padding: 16, color: '#2c3e50', fontSize: 14, fontWeight: 500 }}>
                        {associate.company || '-'}
                      </td>
                      <td style={{ padding: 16, color: '#7f8c8d', fontSize: 14 }}>
                        {associate.mobile || '-'}
                      </td>
                      <td style={{ padding: 16, color: '#7f8c8d', fontSize: 14 }}>{associate.email}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: '4px 12px',
                          background: associate.status === 'active' ? '#d4edda' : '#fff3cd',
                          color: associate.status === 'active' ? '#27ae60' : '#e67e22',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {associate.status === 'active' ? 'Aktivan' : 'Na čekanju'}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        {associate.status === 'pending' && (
                          <button
                            onClick={() => handleApproveUser(associate._id)}
                            disabled={loading}
                            style={{
                              padding: '6px 16px',
                              background: '#6c737b',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 13,
                              marginRight: 8,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.6 : 1
                            }}
                          >
                            Odobri
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(associate._id)}
                          disabled={loading}
                          style={{
                            padding: '6px 16px',
                            background: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 13,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'kvarovi' && (
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 20, color: '#2c3e50' }}>Kvarovi</h2>
          
          {/* Search Bar */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Pretraži kvarove (naziv, opis, stan, stanar)..."
              value={issueSearchQuery}
              onChange={(e) => setIssueSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #dee2e6',
                borderRadius: 6,
                fontSize: 14,
                background: 'white',
                color: '#2c3e50'
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#2c3e50', fontSize: 14 }}>
                Hitnost
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: 6,
                  fontSize: 14,
                  background: 'white',
                  color: '#2c3e50',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Sve hitnosti</option>
                <option value="high">Hitno</option>
                <option value="medium,low">Nije hitno</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#2c3e50', fontSize: 14 }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: 6,
                  fontSize: 14,
                  background: 'white',
                  color: '#2c3e50',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Svi statusi</option>
                <option value="forwarded">Prosleđen</option>
                <option value="assigned">Dodeljen</option>
                <option value="in-progress">U toku</option>
                <option value="resolved">Rešen</option>
                <option value="rejected">Odbijen</option>
              </select>
            </div>
          </div>

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
                {issues.length === 0 ? 'Nema prijavljenih kvarova' : 'Nema kvarova sa izabranim filterima'}
              </h3>
              <p style={{ color: '#7f8c8d', fontSize: 14 }}>
                {issues.length === 0 
                  ? 'Kvarovi će se pojaviti ovde nakon što ih stanari prijave'
                  : 'Promenite filtere da vidite druge kvarove'}
              </p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #dee2e6', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Opis</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Stan</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Prijavio</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Prioritet</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Status</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Dodeljen</th>
                    <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map(issue => (
                    <tr key={issue._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                      <td style={{ padding: 16, color: '#2c3e50', fontSize: 14, maxWidth: 200 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{issue.title}</div>
                        <div style={{ fontSize: 13, color: '#7f8c8d' }}>{issue.description}</div>
                      </td>
                      <td style={{ padding: 16, color: '#7f8c8d', fontSize: 14 }}>
                        Stan {issue.apartment?.number || 'N/A'}
                      </td>
                      <td style={{ padding: 16, color: '#7f8c8d', fontSize: 14 }}>
                        {issue.createdBy?.firstName} {issue.createdBy?.lastName}
                      </td>
                      <td style={{ padding: 16 }}>
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
                      </td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: '4px 12px',
                          background: issue.status === 'resolved' ? '#d4edda' : issue.status === 'in-progress' ? '#fff3cd' : issue.status === 'assigned' ? '#cfe2ff' : issue.status === 'forwarded' ? '#ffeaa7' : issue.status === 'rejected' ? '#fee2e2' : '#f8f9fa',
                          color: issue.status === 'resolved' ? '#27ae60' : issue.status === 'in-progress' ? '#e67e22' : issue.status === 'assigned' ? '#3498db' : issue.status === 'forwarded' ? '#d35400' : issue.status === 'rejected' ? '#c0392b' : '#7f8c8d',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {issue.status === 'reported' ? 'Prijavljen' : 
                           issue.status === 'forwarded' ? 'Prosleđen direktoru' : 
                           issue.status === 'assigned' ? 'Dodeljen' : 
                           issue.status === 'in-progress' ? 'U toku' : 
                           issue.status === 'resolved' ? 'Završen' : 
                           issue.status === 'rejected' ? 'Odbijen' : 'Nepoznato'}
                        </span>
                      </td>
                      <td style={{ padding: 16, color: '#7f8c8d', fontSize: 14 }}>
                        {issue.assignedTo ? `${issue.assignedTo.firstName} ${issue.assignedTo.lastName}` : '-'}
                      </td>
                      <td style={{ padding: 16 }}>
                        {/* forwarded: dugme "DODELI", assigned: dugme "PROMENI", ostali: nema dugme */}
                        {issue.status === 'forwarded' ? (
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowAssignIssueModal(true);
                            }}
                            disabled={loading}
                            style={{
                              padding: '6px 16px',
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 13,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.6 : 1
                            }}
                          >
                            Dodeli
                          </button>
                        ) : issue.status === 'assigned' ? (
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowAssignIssueModal(true);
                            }}
                            disabled={loading}
                            style={{
                              padding: '6px 16px',
                              background: '#e67e22',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 13,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.6 : 1
                            }}
                          >
                            Promeni
                          </button>
                        ) : (
                          <span style={{ fontSize: 13, color: '#95a5a6' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'dugovanja' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#2c3e50' }}>Dugovanja</h2>
              <div style={{ display: 'flex', gap: 30, margin: '5px 0 0 0' }}>
                <p style={{ color: '#e74c3c', margin: 0, fontSize: 16, fontWeight: 500 }}>
                  Ukupno dugovanja: {invoices.reduce((sum, group) => sum + group.total, 0).toLocaleString('sr-RS')} RSD
                </p>
                <p style={{ color: '#27ae60', margin: 0, fontSize: 16, fontWeight: 500 }}>
                  Budžet: {userProfile.budget?.toLocaleString('sr-RS') || 0} RSD
                </p>
              </div>
            </div>
          </div>

          {/* Search and Sort */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <input
              type="text"
              value={invoiceSearchQuery}
              onChange={(e) => setInvoiceSearchQuery(e.target.value)}
              placeholder="Pretraži po firmi, imenu, nazivu..."
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: 15,
                border: '1px solid #dee2e6',
                borderRadius: 6,
                boxSizing: 'border-box'
              }}
            />
            <select
              value={invoiceSortOrder}
              onChange={(e) => setInvoiceSortOrder(e.target.value)}
              style={{
                padding: '12px 16px',
                fontSize: 15,
                border: '1px solid #dee2e6',
                borderRadius: 6,
                background: 'white',
                color: '#2c3e50',
                cursor: 'pointer',
                minWidth: 200
              }}
            >
              <option value="newest">Najnoviji</option>
              <option value="oldest">Najstariji</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <p style={{ color: '#95a5a6', fontSize: 16 }}>Učitavanje dugovanja...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 80,
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: 8, fontSize: 18 }}>Nema neplaćenih dugovanja</h3>
              <p style={{ color: '#7f8c8d', fontSize: 14 }}>Sve fakture su plaćene</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {invoices
                .filter(group => {
                  if (!invoiceSearchQuery.trim()) return true;
                  const query = invoiceSearchQuery.toLowerCase();
                  return (
                    group.company.toLowerCase().includes(query) ||
                    group.invoices.some(inv => 
                      inv.title?.toLowerCase().includes(query) ||
                      inv.reason?.toLowerCase().includes(query) ||
                      inv.associateName?.toLowerCase().includes(query)
                    )
                  );
                })
                .map(group => {
                  // Sort invoices within group
                  const sortedInvoices = [...group.invoices].sort((a, b) => {
                    if (invoiceSortOrder === 'newest') {
                      return new Date(b.date) - new Date(a.date);
                    } else {
                      return new Date(a.date) - new Date(b.date);
                    }
                  });

                  return (
                    <div key={group.company} style={{
                      background: 'white',
                      borderRadius: 8,
                      border: '1px solid #dee2e6',
                      overflow: 'hidden'
                    }}>
                      {/* Company Header */}
                      <div style={{
                        background: '#f8f9fa',
                        padding: '16px 20px',
                        borderBottom: '1px solid #dee2e6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#2c3e50' }}>
                            {group.company}
                          </h3>
                        </div>
                        <div style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: '#e67e22'
                        }}>
                          {group.total.toLocaleString('sr-RS')} RSD
                        </div>
                      </div>

                      {/* Invoices Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e9ecef' }}>
                            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 13 }}>
                              Saradnik
                            </th>
                            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 13 }}>
                              Naziv
                            </th>
                            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 13 }}>
                              Razlog
                            </th>
                            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#2c3e50', fontSize: 13 }}>
                              Datum
                            </th>
                            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#2c3e50', fontSize: 13 }}>
                              Iznos
                            </th>
                            <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#2c3e50', fontSize: 13 }}>
                              Akcija
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedInvoices.map(invoice => (
                            <tr key={invoice._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                              <td style={{ padding: 12, color: '#2c3e50', fontSize: 14 }}>
                                {invoice.associate?.firstName} {invoice.associate?.lastName}
                              </td>
                              <td style={{ padding: 12, color: '#2c3e50', fontSize: 14, fontWeight: 500 }}>
                                {invoice.title}
                              </td>
                              <td style={{ padding: 12, color: '#7f8c8d', fontSize: 14, maxWidth: 250 }}>
                                {invoice.reason || '-'}
                              </td>
                              <td style={{ padding: 12, color: '#7f8c8d', fontSize: 14 }}>
                                {new Date(invoice.date).toLocaleDateString('sr-RS')}
                              </td>
                              <td style={{ padding: 12, color: '#2c3e50', fontSize: 14, fontWeight: 500, textAlign: 'right' }}>
                                {invoice.amount.toLocaleString('sr-RS')} RSD
                              </td>
                              <td style={{ padding: 12, textAlign: 'center' }}>
                                <button
                                  onClick={() => handlePayInvoice(invoice._id)}
                                  disabled={loading}
                                  style={{
                                    padding: '6px 16px',
                                    background: '#27ae60',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1
                                  }}
                                >
                                  Plati
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {showAssignIssueModal && selectedIssue && (
        <div
          onClick={() => setShowAssignIssueModal(false)}
          style={{
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
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 8,
              padding: 30,
              maxWidth: 500,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: 20 }}>
              Dodeli ili odbij kvar
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#7f8c8d', fontSize: 14 }}>
              Kvar: {selectedIssue.title}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#2c3e50', fontSize: 14 }}>
                Izaberi servis
              </label>
              <select
                value={selectedIssue.assignedTo?._id || ''}
                onChange={(e) => {
                  const assignedTo = e.target.value;
                  if (assignedTo) {
                    handleAssignIssue(selectedIssue._id, 'assign', assignedTo);
                  }
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: 6,
                  fontSize: 14,
                  background: 'white',
                  color: '#2c3e50',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">-- Izaberi servis --</option>
                {associates.filter(a => a.status === 'active').map(associate => (
                  <option key={associate._id} value={associate._id}>
                    {associate.firstName} {associate.lastName} ({associate.email})
                  </option>
                ))}
              </select>
              {associates.filter(a => a.status === 'active').length === 0 && (
                <p style={{ marginTop: 12, color: '#7f8c8d', fontSize: 13 }}>
                  Nema dostupnih servisa
                </p>
              )}
            </div>
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => handleAssignIssue(selectedIssue._id, 'reject')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Odbij kvar
              </button>
            </div>
            <button
              onClick={() => setShowAssignIssueModal(false)}
              style={{
                width: '100%',
                padding: 12,
                marginTop: 12,
                background: '#f8f9fa',
                color: '#2c3e50',
                border: '1px solid #dee2e6',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectorDashboard;
