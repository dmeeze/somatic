/**
 * theme.js — applyTheme(theme, urgencyCount)
 * Writes all theme CSS custom properties to :root.
 * urgencyCount: how many --urgency-N vars to write (interpolated from 3-stop gradient).
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
 * @param {[string, string, string]} gradient3
 * @param {number} n
 * @returns {string[]}
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
 * @param {number} [urgencyCount=5] - Number of urgency levels to interpolate colours for.
 */
export function applyTheme(theme, urgencyCount = 5) {
  const root = document.documentElement;
  const { colors, shape, typography } = theme;

  // Colour slots
  for (const [key, prop] of Object.entries(COLOR_MAP)) {
    if (colors[key]) root.style.setProperty(prop, colors[key]);
  }

  // Urgency gradient — interpolate N stops from 3-stop gradient
  if (Array.isArray(colors.urgencyGradient) && colors.urgencyGradient.length === 3) {
    const stops = interpolateUrgencyColors(colors.urgencyGradient, urgencyCount);
    stops.forEach((hex, i) => root.style.setProperty(`--urgency-${i}`, hex));
  }

  // Shape
  if (shape?.radius && RADIUS_MAP[shape.radius]) {
    root.style.setProperty('--radius', RADIUS_MAP[shape.radius]);
  }

  // Typography
  const fonts = FONT_MAP[typography?.pairing] ?? FONT_MAP.friendly;
  root.style.setProperty('--heading-font', fonts.heading);
  root.style.setProperty('--body-font', fonts.body);
}
