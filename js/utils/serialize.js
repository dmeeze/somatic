/**
 * serialize.js — Theme import/export utilities.
 */

const REQUIRED_COLOR_KEYS = [
  'pageBg', 'surfaceBg', 'textPrimary', 'textMuted',
  'accentPrimary', 'accentSecondary', 'urgencyGradient',
  'cardBg', 'cardText', 'cardAccent',
];

/**
 * Serialize a Theme object to a base64 share code.
 * @param {object} theme
 * @returns {string}
 */
export function serializeTheme(theme) {
  const payload = {
    n: theme.name,
    c: theme.colors,
    t: theme.typography,
    s: theme.shape,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

/**
 * Deserialize a base64 share code back into a Theme object.
 * Throws if the code is invalid or missing required fields.
 * @param {string} code
 * @returns {object}
 */
export function deserializeTheme(code) {
  let payload;
  try {
    payload = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  } catch {
    throw new Error('Invalid theme code — could not decode');
  }

  if (!payload || typeof payload !== 'object') throw new Error('Invalid theme code');
  if (!payload.n || typeof payload.n !== 'string') throw new Error('Theme is missing a name');
  if (!payload.c || typeof payload.c !== 'object') throw new Error('Theme is missing color data');
  if (!payload.t || typeof payload.t !== 'object') throw new Error('Theme is missing typography data');
  if (!payload.s || typeof payload.s !== 'object') throw new Error('Theme is missing shape data');

  for (const key of REQUIRED_COLOR_KEYS) {
    if (!(key in payload.c)) throw new Error(`Theme is missing color: ${key}`);
  }
  if (!Array.isArray(payload.c.urgencyGradient) || payload.c.urgencyGradient.length !== 3) {
    throw new Error('Theme urgency gradient must have 3 colours');
  }

  return {
    id: 'custom-' + Date.now(),
    name: String(payload.n).slice(0, 40),
    builtIn: false,
    colors: payload.c,
    typography: payload.t,
    shape: payload.s,
  };
}
