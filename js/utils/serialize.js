/**
 * serialize.js — Theme import/export utilities.
 * Stub only in Stage 1. Full implementation in Stage 3.
 */

/**
 * Serialize a Theme object to a base64 share code.
 * @param {object} theme
 * @returns {string}
 */
export function serializeTheme(theme) {
  // Stage 3: base64-encode the JSON (minus serialized + builtIn fields)
  throw new Error('serializeTheme: not implemented until Stage 3');
}

/**
 * Deserialize a base64 share code back into a Theme object.
 * @param {string} code
 * @returns {object}
 */
export function deserializeTheme(code) {
  // Stage 3: decode base64, parse JSON, validate schema
  throw new Error('deserializeTheme: not implemented until Stage 3');
}
