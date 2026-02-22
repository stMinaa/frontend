import React from 'react';
import TopNav from './components/TopNav';
import TenantDashboard from './components/tenant/TenantDashboard';
import TenantProfile from './components/tenant/TenantProfile';
import ManagerDashboard from './components/manager/ManagerDashboard';
import ManagerProfile from './components/manager/ManagerProfile';
import DirectorDashboard from './components/director/DirectorDashboard';
import DirectorProfile from './components/director/DirectorProfile';
import AssociateDashboard from './components/associate/AssociateDashboard';
import AssociateProfile from './components/associate/AssociateProfile';

function Dashboard({ user, activeTab, onTabChange, onLogout, onUserUpdate }) {
  // Phase 2: Render TopNav + content based on activeTab

  // Role-based content rendering
  const renderContent = () => {
    const role = user?.role;

    // Profile tab - show role-specific profile
    if (activeTab === 'profile') {
      if (role === 'tenant') return <TenantProfile user={user} onUserUpdate={onUserUpdate} />;
      if (role === 'manager') return <ManagerProfile user={user} onUserUpdate={onUserUpdate} />;
      if (role === 'director') return <DirectorProfile user={user} onUserUpdate={onUserUpdate} />;
      if (role === 'associate') return <AssociateProfile user={user} onUserUpdate={onUserUpdate} />;
    }

    // Director tabs
    if (role === 'director') {
      return <DirectorDashboard user={user} activeTab={activeTab} />;
    }

    // Manager tabs
    if (role === 'manager') {
      return <ManagerDashboard user={user} activeTab={activeTab} />;
    }

    // Tenant tabs - pass activeTab as tenantNav and a setter function
    if (role === 'tenant') {
      return <TenantDashboard user={user} tenantNav={activeTab} setTenantNav={onTabChange} onUserUpdate={onUserUpdate} />;
    }

    // Associate tabs
    if (role === 'associate') {
      return <AssociateDashboard user={user} activeTab={activeTab} />;
    }

    // Fallback for unknown role or tab
    return (
      <div style={{ padding: 20 }}>
        <p>Unknown role or tab</p>
      </div>
    );
  };

  return (
    <div className="App">
      <TopNav
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
      />
      {renderContent()}
    </div>
  );
}

export default Dashboard;
