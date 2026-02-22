import React from 'react';

function AdminDashboard() {
  return (
    <div className="card">
      <div className="card-header"><h2>Admin Dashboard</h2><div className="muted">User and system management</div></div>
      <div style={{display:'grid',gap:12}}>
        <div>
          <h4>Users</h4>
          <div className="muted">(Coming soon) View and manage user accounts, roles and permissions.</div>
        </div>
        <div>
          <h4>System Settings</h4>
          <div className="muted">(Coming soon) Configure application-wide settings, integrations and logs.</div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
