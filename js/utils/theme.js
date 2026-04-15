/**
 * theme.js — applyTheme(theme)
 * Writes all theme CSS custom properties to :root.
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
  friendly:  { heading: "'Nunito', sans-serif",             body: "'Nunito', sans-serif" },
  ornate:    { heading: "'Cinzel', serif",                  body: "'Crimson Text', serif" },
  editorial: { heading: "'Playfair Display', serif",        body: "'Lora', serif" },
  sport:     { heading: "'Barlow Condensed', sans-serif",   body: "'Barlow', sans-serif" },
  technical: { heading: "'Exo 2', sans-serif",              body: "'Exo 2', sans-serif" },
  cosmic:    { heading: "'Orbitron', sans-serif",           body: "'Rajdhani', sans-serif" },
};

/**
 * Apply a Theme object to the document root's CSS custom properties.
 * @param {object} theme
 */
export function applyTheme(theme) {
  const root = document.documentElement;
  const { colors, shape, typography } = theme;

  // Colour slots
  for (const [key, prop] of Object.entries(COLOR_MAP)) {
    if (colors[key]) root.style.setProperty(prop, colors[key]);
  }

  // Urgency gradient stops
  if (Array.isArray(colors.urgencyGradient)) {
    colors.urgencyGradient.forEach((hex, i) => {
      root.style.setProperty(`--urgency-${i}`, hex);
    });
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
