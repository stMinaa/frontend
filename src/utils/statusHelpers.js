export function statusClass(s) {
  if (!s) return 'badge reported';
  const st = s.toLowerCase();
  if (st === 'reported' || st === 'open') return 'badge reported';
  if (st === 'forwarded') return 'badge forwarded';
  if (st === 'assigned') return 'badge in-review';
  if (st === 'in progress' || st === 'in-progress') return 'badge in-progress';
  if (st === 'resolved') return 'badge done';
  if (st === 'rejected') return 'badge rejected';
  return 'badge reported';
}

export function statusLabel(s) {
  const st = (s || 'reported').toString().toLowerCase().replace(/-/g, ' ');
  if (st === 'open' || st === 'reported') return 'Prijavljen';
  if (st === 'forwarded') return 'Prosleđen direktoru';
  if (st === 'assigned') return 'Dodeljen';
  if (st === 'in progress') return 'U toku';
  if (st === 'resolved') return 'Završen';
  if (st === 'rejected') return 'Odbijen';
  return st.split(' ').map(w => (w ? w[0].toUpperCase() + w.slice(1) : '')).join(' ');
}
