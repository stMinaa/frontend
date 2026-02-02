import React from 'react';

function CompanyHome() {
  return (
    <div className="card" style={{maxWidth:900, margin:'0 auto'}}>
      <div className="card-header">
        <h2 style={{margin:0}}>Welcome to Tenant Management</h2>
        <div className="muted">A simpler way to manage buildings and community life</div>
      </div>
      <div style={{display:'grid', gap:16}}>
        <section>
          <h4 style={{marginTop:0}}>About Us</h4>
          <p style={{margin:0, color:'#334155'}}>
            We help directors, managers, associates, and tenants collaborate smoothly. Report and resolve
            issues faster, share important notices, and keep everyone in the loop—on one platform.
          </p>
        </section>
        <section>
          <h4 style={{marginTop:0}}>What You Can Do</h4>
          <ul style={{margin:'8px 0 0', paddingLeft:18, color:'#334155'}}>
            <li>Tenants: Report issues, read notices, and vote in polls.</li>
            <li>Managers: Manage buildings, assign tenants, post bulletins, and triage issues.</li>
            <li>Directors: Create buildings, assign managers, approve staff, and route complex issues.</li>
            <li>Associates: View assigned jobs, accept with cost, and resolve tasks efficiently.</li>
          </ul>
        </section>
        <section>
          <h4 style={{marginTop:0}}>Support</h4>
          <div className="muted">Need help? Reach us at support@tenantmgmt.example or +1 (555) 012-3456.</div>
        </section>
        <section className="accent-indigo" style={{padding:12, border:'1px solid #e5e7eb', borderRadius:10}}>
          <div style={{fontWeight:600}}>Tips</div>
          <ul style={{margin:'6px 0 0', paddingLeft:18, color:'#334155'}}>
            <li>Keep your profile up to date for faster coordination.</li>
            <li>Enable browser notifications to never miss important updates.</li>
            <li>Use the Profile tab to manage your personal details.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default CompanyHome;
