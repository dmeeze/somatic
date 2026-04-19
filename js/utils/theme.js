/**
 * theme.js — applyTheme, serializeTheme, deserializeTheme, and picker constants.
 */

const COLOR_MAP = {
  pageBg:          '--page-bg',
  surfaceBg:       '--surface-bg',
  textPrimary:     '--text-primary',
  textMuted:       '--text-muted',
  accentPrimary:   '--accent-primary',
  accentSecondary: '--accent-secondary',
  cardBg:          '--card-bg',
  cardText:        '--card-text',
  cardAccent:      '--card-accent',
};

const RADIUS_MAP = {
  sharp: '0px',
  soft:  '12px',
  round: '24px',
};

const FONT_MAP = {
  friendly:    { heading: "'Nunito', sans-serif",             body: "'Nunito', sans-serif" },
  ornate:      { heading: "'Cinzel', serif",                  body: "'Crimson Text', serif" },
  editorial:   { heading: "'Playfair Display', serif",        body: "'Lora', serif" },
  sport:       { heading: "'Barlow Condensed', sans-serif",   body: "'Barlow', sans-serif" },
  technical:   { heading: "'Exo 2', sans-serif",              body: "'Exo 2', sans-serif" },
  cosmic:      { heading: "'Orbitron', sans-serif",           body: "'Rajdhani', sans-serif" },
  bubbly:      { heading: "'Comfortaa', sans-serif",          body: "'Comfortaa', sans-serif" },
  retro:       { heading: "'Pacifico', cursive",              body: "'Nunito', sans-serif" },
  handwritten: { heading: "'Caveat', cursive",                body: "'Nunito', sans-serif" },
};

// ── Public constants for the theme editor UI ──────────────────────────────────

export const FONT_PAIRINGS = [
  { id: 'friendly',    label: 'Friendly',    headingFont: "'Nunito', sans-serif" },
  { id: 'ornate',      label: 'Ornate',      headingFont: "'Cinzel', serif" },
  { id: 'editorial',   label: 'Editorial',   headingFont: "'Playfair Display', serif" },
  { id: 'sport',       label: 'Sport',       headingFont: "'Barlow Condensed', sans-serif" },
  { id: 'technical',   label: 'Technical',   headingFont: "'Exo 2', sans-serif" },
  { id: 'cosmic',      label: 'Cosmic',      headingFont: "'Orbitron', sans-serif" },
  { id: 'bubbly',      label: 'Bubbly',      headingFont: "'Comfortaa', sans-serif" },
  { id: 'retro',       label: 'Retro',       headingFont: "'Pacifico', cursive" },
  { id: 'handwritten', label: 'Handwritten', headingFont: "'Caveat', cursive" },
];

export const SCALE_OPTIONS = [
  { id: 'default', label: 'Small',  px: '16px' },
  { id: 'large',   label: 'Medium', px: '19px' },
  { id: 'xlarge',  label: 'Large',  px: '22px' },
];

export const RADIUS_OPTIONS = [
  { id: 'sharp', label: 'Sharp' },
  { id: 'soft',  label: 'Soft'  },
  { id: 'round', label: 'Round' },
];

// ── Compact theme serialization ───────────────────────────────────────────────
// Format: { v:1, n:"name", c:[12 hex strings without #], f:pairing_idx, s:scale_idx, r:radius_idx }
// Typical output: ~180 chars of JSON → ~240 chars of base64

const _FONT_IDS   = FONT_PAIRINGS.map(p => p.id);
const _SCALE_IDS  = SCALE_OPTIONS.map(s => s.id);
const _RADIUS_IDS = RADIUS_OPTIONS.map(r => r.id);
const _COLOR_ORDER = [
  'pageBg', 'surfaceBg', 'textPrimary', 'textMuted',
  'accentPrimary', 'accentSecondary', 'cardBg', 'cardText', 'cardAccent',
];

export function serializeTheme(theme) {
  const c = _COLOR_ORDER.map(k => (theme.colors[k] || '#000000').replace(/^#/, ''));
  const ug = (theme.colors.urgencyGradient || ['#000000', '#808080', '#ffffff']).map(h => h.replace(/^#/, ''));
  const fi = _FONT_IDS.indexOf(theme.typography?.pairing);
  const si = _SCALE_IDS.indexOf(theme.typography?.scale || 'default');
  const ri = _RADIUS_IDS.indexOf(theme.shape?.radius || 'soft');
  const payload = {
    v: 1,
    n: (theme.name || 'Custom').slice(0, 64),
    c: [...c, ...ug],
    f: fi >= 0 ? fi : 0,
    s: si >= 0 ? si : 0,
    r: ri >= 0 ? ri : 1,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function deserializeTheme(b64) {
  let p;
  try {
    p = JSON.parse(decodeURIComponent(escape(atob(b64.trim()))));
  } catch {
    throw new Error('Invalid theme code.');
  }
  if (!p || p.v !== 1 || !Array.isArray(p.c) || p.c.length !== 12) {
    throw new Error('Invalid theme format.');
  }
  const c = p.c;
  return {
    id: 'imported-' + Date.now(),
    name: String(p.n || 'Imported Theme').slice(0, 64),
    builtIn: false,
    colors: {
      pageBg:          '#' + c[0],
      surfaceBg:       '#' + c[1],
      textPrimary:     '#' + c[2],
      textMuted:       '#' + c[3],
      accentPrimary:   '#' + c[4],
      accentSecondary: '#' + c[5],
      cardBg:          '#' + c[6],
      cardText:        '#' + c[7],
      cardAccent:      '#' + c[8],
      urgencyGradient: ['#' + c[9], '#' + c[10], '#' + c[11]],
    },
    typography: {
      pairing: _FONT_IDS[Math.min(Math.max(0, p.f || 0), _FONT_IDS.length - 1)],
      scale:   _SCALE_IDS[Math.min(Math.max(0, p.s || 0), _SCALE_IDS.length - 1)],
    },
    shape: {
      radius: _RADIUS_IDS[Math.min(Math.max(0, p.r || 0), _RADIUS_IDS.length - 1)],
    },
  };
}

// ── Colour interpolation ──────────────────────────────────────────────────────

function _hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function _rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function _lerpColor(a, b, t) {
  const [ar, ag, ab] = _hexToRgb(a);
  const [br, bg, bb] = _hexToRgb(b);
  return _rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/**
 * Interpolate N evenly-spaced colours from a 3-stop [good, mid, bad] gradient.
 */
export function interpolateUrgencyColors(gradient3, n) {
  const [good, mid, bad] = gradient3;
  if (n === 1) return [good];
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return t <= 0.5 ? _lerpColor(good, mid, t * 2) : _lerpColor(mid, bad, (t - 0.5) * 2);
  });
}

/**
 * Apply a Theme object to the document root's CSS custom properties.
 * @param {object} theme
 * @param {number} [urgencyCount=5]
 */
export function applyTheme(theme, urgencyCount = 5) {
  const root = document.documentElement;
  const { colors, shape, typography } = theme;

  for (const [key, prop] of Object.entries(COLOR_MAP)) {
    if (colors[key]) root.style.setProperty(prop, colors[key]);
  }

  if (Array.isArray(colors.urgencyGradient) && colors.urgencyGradient.length === 3) {
    const stops = interpolateUrgencyColors(colors.urgencyGradient, urgencyCount);
    stops.forEach((hex, i) => root.style.setProperty(`--urgency-${i}`, hex));
  }

  if (shape?.radius && RADIUS_MAP[shape.radius]) {
    root.style.setProperty('--radius', RADIUS_MAP[shape.radius]);
  }

  const fonts = FONT_MAP[typography?.pairing] ?? FONT_MAP.friendly;
  root.style.setProperty('--heading-font', fonts.heading);
  root.style.setProperty('--body-font', fonts.body);
}
