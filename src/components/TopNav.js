import React from 'react';

function TopNav({ user, activeTab, onTabChange, onLogout }) {
  const role = user?.role;

  // Define tabs based on role
  const getTabs = () => {
    if (role === 'director') {
      return [
        { key: 'zgrade', label: 'Zgrade' },
        { key: 'upravnici', label: 'Upravnici' },
        { key: 'saradnici', label: 'Saradnici' },
        { key: 'kvarovi', label: 'Kvarovi' },
        { key: 'dugovanja', label: 'Dugovanja' }
      ];
    }
    if (role === 'manager') {
      return [
        { key: 'dashboard', label: 'Početna' },
        { key: 'buildings', label: 'Zgrade' }
      ];
    }
    if (role === 'tenant') {
      return [
        { key: 'dashboard', label: 'Početna' },
        { key: 'issues', label: 'Kvarovi' },
        { key: 'bulletin', label: 'Oglasna tabla' }
      ];
    }
    if (role === 'associate') {
      return [
        { key: 'dashboard', label: 'Početna' },
        { key: 'jobs', label: 'Poslovi' }
      ];
    }
    return [{ key: 'dashboard', label: 'Početna' }];
  };

  const tabs = getTabs();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 30px',
      background: '#2c3e50',
      color: 'white',
      borderBottom: '3px solid #3498db'
    }}>
      <div style={{ fontSize: 20, fontWeight: 'bold' }}>
        Smartwalls
      </div>

      <div style={{ display: 'flex', gap: 15 }}>
        <button
          onClick={() => onTabChange('profile')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'profile' ? '#3498db' : 'transparent',
            color: 'white',
            border: '1px solid white',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: activeTab === 'profile' ? 'bold' : 'normal'
          }}
        >
          Profil
        </button>

        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: '8px 20px',
              background: activeTab === tab.key ? '#3498db' : 'transparent',
              color: 'white',
              border: '1px solid white',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 14 }}>
          {user?.firstName || user?.username} ({role})
        </span>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 20px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Odjavi se
        </button>
      </div>
    </nav>
  );
}

export default TopNav;
