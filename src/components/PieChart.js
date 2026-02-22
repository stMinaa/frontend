/* eslint-disable max-lines-per-function */
import React from 'react';

function PieChart({ data, size = 120, colors = [], style = {}, className, donut = true, pastel = true }) {
  // Pastel purples, greens, blues (user request); fallback professional theme if pastel false
  const pastelPalette = [
    '#D8B4FE', '#C4F1C5', '#BFDBFE', '#E9D5FF', '#A7F3D0', '#BAE6FD',
    '#C7D2FE', '#86EFAC', '#BDEAFE', '#DDD6FE', '#A5F3FC'
  ];
  const theme = pastel ? pastelPalette : [
    '#3A5A40', '#1E3A8A', '#64748B', '#588157', '#0F172A', '#94A3B8', '#A3B18A', '#B5C99A'
  ];
  const lighten = (hex, amt = 0.14) => {
    let h = hex.replace('#','');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.min(255, Math.max(0, Math.round(r + (255 - r) * amt)));
    g = Math.min(255, Math.max(0, Math.round(g + (255 - g) * amt)));
    b = Math.min(255, Math.max(0, Math.round(b + (255 - b) * amt)));
    return `#${(1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };
  const uid = Math.random().toString(36).slice(2, 8);
  const rawTotal = data.reduce((a, b) => a + (Number(b.value) || 0), 0);
  // If there are no votes (all zeros), render equal slices so the chart is visible
  const normalized = rawTotal === 0 && data.length > 0
    ? data.map(() => ({ value: 1 }))
    : data.map(d => ({ value: Number(d.value) || 0 }));
  const total = normalized.reduce((a, b) => a + b.value, 0) || 1;
  const nonZeroIndices = normalized.map((d, i) => d.value > 0 ? i : -1).filter(i => i !== -1);
  let cum = 0;
  const radius = size / 2;
  const svgStyle = { display: 'block', margin: '0 auto', ...style };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgStyle} className={className}>
      <defs>
        <filter id={`ds-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
        {(colors.length ? data : theme).map((_, i) => {
          const base = colors.length ? colors[i % colors.length] : theme[i % theme.length];
          const light = lighten(base, 0.18);
          return (
            <linearGradient key={i} id={`grad-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={light} />
              <stop offset="100%" stopColor={base} />
            </linearGradient>
          );
        })}
      </defs>
      {/* Full circle when only one non-zero slice (100%) to avoid degenerate arc */}
      {nonZeroIndices.length === 1 && normalized[nonZeroIndices[0]].value >= total - 1e-9 ? (
        <g filter={`url(#ds-${uid})`}>
          <circle cx={radius} cy={radius} r={radius} fill={`url(#grad-${uid}-${nonZeroIndices[0]})`} />
        </g>
      ) : (
      <g filter={`url(#ds-${uid})`}>
      {normalized.map((d, i) => {
        const start = (cum / total) * 2 * Math.PI;
        const end = ((cum + d.value) / total) * 2 * Math.PI;
        cum += d.value;
        const x1 = radius + radius * Math.sin(start);
        const y1 = radius - radius * Math.cos(start);
        const x2 = radius + radius * Math.sin(end);
        const y2 = radius - radius * Math.cos(end);
        const large = end - start > Math.PI ? 1 : 0;
        const pathData = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
        const _base = (colors[i % (colors.length || 1)]) || theme[i % theme.length];
        const fill = `url(#grad-${uid}-${i})`;
        return <path key={i} d={pathData} fill={fill} stroke="#fff" strokeWidth={1} />;
      })}
      </g>
      )}
      {/* Donut hole for modern look */}
      {donut && (
        <circle cx={radius} cy={radius} r={radius * 0.5} fill="#ffffff" stroke="#e5e7eb" strokeWidth={1} />
      )}
    </svg>
  );
}

export default PieChart;
