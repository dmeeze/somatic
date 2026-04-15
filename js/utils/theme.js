/**
 * theme.js — applyTheme(theme)
 * Writes all theme CSS custom properties to :root.
 */

/**
 * Map from theme color key to CSS custom property name.
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

/**
 * Apply a Theme object to the document root's CSS custom properties.
 * @param {object} theme - Theme object from data/themes.js or data/config.js
 */
export function applyTheme(theme) {
  const root = document.documentElement;
  const { colors, shape } = theme;

  // Named colour slots
  for (const [key, prop] of Object.entries(COLOR_MAP)) {
    if (colors[key]) {
      root.style.setProperty(prop, colors[key]);
    }
  }

  // Urgency gradient stops
  if (Array.isArray(colors.urgencyGradient)) {
    colors.urgencyGradient.forEach((hex, i) => {
      root.style.setProperty(`--urgency-${i}`, hex);
    });
  }

  // Shape / radius
  if (shape?.radius && RADIUS_MAP[shape.radius]) {
    root.style.setProperty('--radius', RADIUS_MAP[shape.radius]);
  }
}
