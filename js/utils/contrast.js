/**
 * contrast.js — WCAG contrast ratio utility.
 * Used in Stage 3 theme editor to validate colour choices.
 */

/**
 * Parse a hex colour string (#RRGGBB or #RGB) into [r, g, b] 0–255.
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Convert an sRGB channel value (0–255) to linear light.
 * @param {number} c
 * @returns {number}
 */
function toLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Relative luminance of a hex colour per WCAG 2.1.
 * @param {string} hex
 * @returns {number} 0–1
 */
function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * WCAG 2.1 contrast ratio between two hex colours.
 * Returns a value between 1 (no contrast) and 21 (black on white).
 *
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number}
 */
export function wcagRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether two colours pass WCAG AA for normal text (4.5:1).
 * @param {string} hex1
 * @param {string} hex2
 * @returns {boolean}
 */
export function passesAA(hex1, hex2) {
  return wcagRatio(hex1, hex2) >= 4.5;
}

/**
 * Check whether two colours pass WCAG AA for large text (3:1).
 * @param {string} hex1
 * @param {string} hex2
 * @returns {boolean}
 */
export function passesAALarge(hex1, hex2) {
  return wcagRatio(hex1, hex2) >= 3;
}
