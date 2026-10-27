// Un set mínimo de iconos propios en SVG, sin depender de una librería externa.
type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconDashboard = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
);
export const IconReports = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6M9 11h6M9 19h3" /></svg>
);
export const IconPipeline = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M9 6h6a3 3 0 0 1 3 3v3M9 18H8a3 3 0 0 1-3-3V9" /></svg>
);
export const IconChat = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
export const IconLogout = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
);
export const IconPulse = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M3 12h4l3 8 4-16 3 8h4" /></svg>
);
export const IconMagnitude = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M3 17l5-10 4 6 3-4 6 8" /></svg>
);
export const IconWave = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" /><path d="M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0" /></svg>
);
export const IconCheck = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M20 6L9 17l-5-5" /></svg>
);
export const IconMap = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13" /></svg>
);
export const IconChart = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M3 3v18h18" /><path d="M7 16l4-6 3 3 5-8" /></svg>
);
export const IconFilter = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M22 3H2l8 9.46V19l4 2v-8.54z" /></svg>
);
export const IconDownload = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
);
export const IconShield = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>
);
export const IconAlert = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
);
