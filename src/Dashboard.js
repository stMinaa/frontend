import React from 'react';
import TopNav from './components/TopNav';
import TenantDashboard from './TenantDashboard';
import TenantProfile from './TenantProfile';
import ManagerDashboard from './ManagerDashboard';
import ManagerProfile from './ManagerProfile';
import DirectorDashboard from './DirectorDashboard';
import DirectorProfile from './DirectorProfile';
import AssociateDashboard from './AssociateDashboard';
import AssociateProfile from './AssociateProfile';

function Dashboard({ user, activeTab, onTabChange, onLogout }) {
  // Phase 2: Render TopNav + content based on activeTab

  // Role-based content rendering
  const renderContent = () => {
    const role = user?.role;

    // Profile tab - show role-specific profile
    if (activeTab === 'profile') {
      if (role === 'tenant') return <TenantProfile user={user} />;
      if (role === 'manager') return <ManagerProfile user={user} />;
      if (role === 'director') return <DirectorProfile user={user} />;
      if (role === 'associate') return <AssociateProfile user={user} />;
    }

    // Director tabs
    if (role === 'director') {
      return <DirectorDashboard user={user} activeTab={activeTab} />;
    }

    // Dashboard tab - show role-specific dashboard
    if (activeTab === 'dashboard') {
      if (role === 'tenant') return <TenantDashboard user={user} />;
      if (role === 'manager') return <ManagerDashboard user={user} />;
      if (role === 'associate') return <AssociateDashboard user={user} />;
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
