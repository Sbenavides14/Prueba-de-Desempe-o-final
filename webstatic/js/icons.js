// Mis iconos propios en SVG, como funciones que devuelven HTML — sin librería externa.
function icon(path, size) {
  size = size || 18;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

const Icons = {
  dashboard: (s) => icon(`<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>`, s),
  reports: (s) => icon(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h6M9 19h3"/>`, s),
  pipeline: (s) => icon(`<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6a3 3 0 0 1 3 3v3M9 18H8a3 3 0 0 1-3-3V9"/>`, s),
  chat: (s) => icon(`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`, s),
  logout: (s) => icon(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>`, s),
  pulse: (s) => icon(`<path d="M3 12h4l3 8 4-16 3 8h4"/>`, s),
  magnitude: (s) => icon(`<path d="M3 17l5-10 4 6 3-4 6 8"/>`, s),
  wave: (s) => icon(`<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>`, s),
  check: (s) => icon(`<path d="M20 6L9 17l-5-5"/>`, s),
  globe: (s) => icon(`<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>`, s),
  chart: (s) => icon(`<path d="M3 3v18h18"/><path d="M7 16l4-6 3 3 5-8"/>`, s),
  filter: (s) => icon(`<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>`, s),
  download: (s) => icon(`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>`, s),
  shield: (s) => icon(`<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>`, s),
  alert: (s) => icon(`<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>`, s),
};
