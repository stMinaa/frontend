import React, { useState } from 'react';

import './App.css';
import Dashboard from './Dashboard';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Phase 2: Removed auto-login - user must login each session
  // No useEffect for localStorage token check

  const handleLogin = (token, userData) => {
    // Store token but don't persist user object
    localStorage.setItem('token', token);
    setUser(userData);
    setActiveTab('profile'); // Phase 2: Land on profile after login
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentPage('login');
    setActiveTab('profile');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  // Not logged in
  if (!user) {
    return (
      <div className="App">
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'login' && <Login onLogin={handleLogin} onNavigate={handleNavigate} />}
        {currentPage === 'signup' && <Signup onNavigate={handleNavigate} />}
      </div>
    );
  }

  // Logged in - Phase 2: Use Dashboard wrapper with role-based routing
  return (
    <Dashboard
      user={user}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
      onUserUpdate={handleUserUpdate}
    />
  );
}

export default App;
