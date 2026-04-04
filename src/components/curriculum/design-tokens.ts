/**
 * Abeka Curriculum Design Tokens
 * Brand colors, typography, and spacing for the curriculum system
 */

// Brand Colors from Kisu Character Bible
export const abekaColors = {
  // Primary Brand
  amberDiep: '#C97A2F',
  inkBlue: '#1B4F8A',
  chamJade: '#4ECDC4',
  navyDem: '#1A2744',
  ivoryAm: '#F5EDD6',
  soilBrown: '#7A3B2E',
  goldStar: '#FFD700',

  // Subject Colors
  subjects: {
    PHONICS: '#8b5cf6',      // Purple
    ARITHMETIC: '#10b981',   // Emerald
    BIBLE: '#f59e0b',        // Amber
    WRITING: '#ef4444',      // Red
    SCIENCE: '#06b6d4',      // Cyan
    HISTORY: '#d946ef',      // Fuchsia
    ACTIVITIES: '#84cc16',   // Lime
    READING: '#3b82f6',      // Blue
  } as const,

  // Grade Colors
  grades: {
    K4: '#FF9F43',
    K5: '#FF9F43',
    G1: '#F368E0',
    G2: '#F368E0',
    G3: '#54A0FF',
    G4: '#54A0FF',
    G5: '#5F27CD',
    G6: '#5F27CD',
    G7: '#00D2D3',
    G8: '#00D2D3',
    G9: '#FF6B6B',
    G10: '#FF6B6B',
    G11: '#48DBFB',
    G12: '#48DBFB',
  } as const,

  // Progress States
  progress: {
    notStarted: '#e5e7eb',
    inProgress: '#3b82f6',
    completed: '#22c55e',
    overdue: '#ef4444',
  },

  // UI Surface Colors
  surface: {
    background: '#f8fafc',
    card: '#ffffff',
    elevated: '#f1f5f9',
    border: '#e2e8f0',
  },

  // Text Colors
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },
};

// Typography
export const typography = {
  fontFamily: {
    heading: "'Be Vietnam Pro', 'Inter', sans-serif",
    body: "'Be Vietnam Pro', 'Inter', sans-serif",
    display: "'Quicksand', 'Be Vietnam Pro', sans-serif",
  },
  sizes: {
    hero: '2.5rem',      // 40px
    h1: '2rem',          // 32px
    h2: '1.5rem',        // 24px
    h3: '1.25rem',       // 20px
    body: '1rem',        // 16px
    small: '0.875rem',   // 14px
    tiny: '0.75rem',     // 12px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

// Spacing Scale (4px base)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

// Border Radius
export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  glow: '0 0 20px rgba(78, 205, 196, 0.3)',
  card: '0 2px 8px rgba(0,0,0,0.08)',
};

// Animation Durations
export const durations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Easing Functions
export const easing = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
};

// Breakpoints
export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  tooltip: 500,
  toast: 600,
};
