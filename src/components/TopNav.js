/* eslint-disable max-lines-per-function */
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
        { key: 'buildings', label: 'Zgrade' },
        { key: 'kvarovi', label: 'Kvarovi' }
      ];
    }
    if (role === 'tenant') {
      return [
        { key: 'issues', label: 'Kvarovi' },
        { key: 'bulletin', label: 'Oglasna tabla' }
      ];
    }
    if (role === 'associate') {
      return [
        { key: 'kvarovi', label: 'Kvarovi' }
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
      background: '#16202b',
      color: 'white'
    }}>
      <div style={{ fontSize: 20, fontWeight: 'bold' }}>
        Smart Walls
      </div>

      <div style={{ display: 'flex', gap: 15 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: '8px 20px',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: 'white',
              border: activeTab === tab.key ? '1px solid rgba(255,255,255,0.3)' : 'none',
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
        <button
          onClick={() => onTabChange('profile')}
          style={{
            padding: '6px 12px',
            background: activeTab === 'profile' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title="Profil"
        >
          Profile
        </button>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center'
          }}
          title="Odjavi se"
        >
          Exit
        </button>
      </div>
    </nav>
  );
}

export default TopNav;
