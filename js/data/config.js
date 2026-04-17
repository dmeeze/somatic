/**
 * config.js — Full data model + hard-coded defaults.
 * No localStorage in Stage 1. State is in-memory only.
 *
 * Exports:
 *   getConfig()        → deep clone of the default AppConfig
 *   getSession()       → current ephemeral session state
 *   updateSession(patch) → merge patch into session state
 */

import { BUILT_IN_THEMES } from './themes.js';

/** @type {import('./types').AppConfig} */
const DEFAULT_CONFIG = {
  urgencyLevels: [
    { id: 'u1', label: 'I am happy!',                   icon: 'fad fa-smile-beam' },
    { id: 'u2', label: 'I am ok',                        icon: 'fad fa-meh' },
    { id: 'u3', label: 'I am stressed',                  icon: 'fad fa-grimace' },
    { id: 'u4', label: 'I am about to have a meltdown',  icon: 'fad fa-sad-cry' },
    { id: 'u5', label: 'I am having a meltdown',         icon: 'fad fa-dizzy' },
  ],

  defaultUrgencyIndex: 2, // 0-based → "I am stressed"

  needs: [
    { id: 'n1', label: 'I have a question but cannot ask it right now', icon: 'fad fa-question-circle',    isSomethingElse: false, enabled: true },
    { id: 'n2', label: 'I need a quiet space',                          icon: 'fad fa-deaf',               isSomethingElse: false, enabled: true },
    { id: 'n3', label: 'I need some time',                              icon: 'fad fa-hourglass-half',     isSomethingElse: false, enabled: true },
    { id: 'n4', label: 'I need my self-soothing tools',                 icon: 'fad fa-hand-holding-heart', isSomethingElse: false, enabled: true },
    { id: 'n5', label: 'I need to contact my parents / carer',          icon: 'fad fa-phone',              isSomethingElse: false, enabled: true },
    { id: 'n6', label: 'I need water',                                  icon: 'fad fa-tint',               isSomethingElse: false, enabled: true },
    { id: 'n7', label: 'I need to move / walk',                         icon: 'fad fa-walking',            isSomethingElse: false, enabled: true },
    { id: 'n8', label: 'Something else\u2026',                          icon: 'fad fa-ellipsis-h',         isSomethingElse: true,  enabled: true },
  ],

  activeThemeId: 'bright-sunny',

  themes: BUILT_IN_THEMES,

  ui: {
    reduceMotion: false,
    fontSize: 'default',
    keepScreenOn: true,
    fullIconList: false,
    needsHeading: 'I want to say',
    showBtnLabel: 'Show',
    showBtnIcon: 'fad fa-id-card',
    settingsIcon: 'fad fa-cog',
  },
};

const STORAGE_KEY = 'somatic_config';
const SCHEMA_VERSION = 8; // bump when DEFAULT_CONFIG shape changes incompatibly

/**
 * Migrate a v5 AppConfig to v6.
 * Change: urgencyGradient on every theme goes from 5-stop to 3-stop [good, mid, bad]
 * by taking indices [0], [2], [4] from the old array.
 */
function _migrateV5toV6(config) {
  const themes = config.themes.map(theme => {
    const g = theme.colors?.urgencyGradient;
    if (!Array.isArray(g) || g.length !== 5) return theme;
    return {
      ...theme,
      colors: {
        ...theme.colors,
        urgencyGradient: [g[0], g[2], g[4]],
      },
    };
  });
  return { ...config, themes };
}

/**
 * Migrate a v6 AppConfig to v7.
 * Change: adds ui.needsHeading, ui.showBtnLabel, ui.showBtnIcon, ui.settingsIcon
 */
function _migrateV6toV7(config) {
  return {
    ...config,
    ui: {
      needsHeading: 'I want to say',
      showBtnLabel: 'Show',
      showBtnIcon: 'fas fa-id-card',
      settingsIcon: 'fas fa-cog',
      ...config.ui,
    },
  };
}

/**
 * Migrate a v7 AppConfig to v8.
 * Change: all user-facing icons switch from fas to fad (duotone).
 */
function _migrateV7toV8(config) {
  const swapPrefix = (icon) => typeof icon === 'string' ? icon.replace(/^fas /, 'fad ') : icon;
  return {
    ...config,
    urgencyLevels: (config.urgencyLevels || []).map(u => ({ ...u, icon: swapPrefix(u.icon) })),
    needs: (config.needs || []).map(n => ({ ...n, icon: swapPrefix(n.icon) })),
    ui: {
      ...config.ui,
      showBtnIcon: swapPrefix(config.ui?.showBtnIcon),
      settingsIcon: swapPrefix(config.ui?.settingsIcon),
    },
  };
}

export function getConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed._version === 5) {
        // Migrate v5 → v6 → v7 → v8
        const migrated = _migrateV7toV8(_migrateV6toV7(_migrateV5toV6(parsed)));
        saveConfig(migrated);
        return migrated;
      }
      if (parsed._version === 6) {
        // Migrate v6 → v7 → v8
        const migrated = _migrateV7toV8(_migrateV6toV7(parsed));
        saveConfig(migrated);
        return migrated;
      }
      if (parsed._version === 7) {
        // Migrate v7 → v8
        const migrated = _migrateV7toV8(parsed);
        saveConfig(migrated);
        return migrated;
      }
      // If stored config is from a previous schema version, discard it
      if (parsed._version !== SCHEMA_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        return parsed;
      }
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function saveConfig(config) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, _version: SCHEMA_VERSION })); } catch {}
}

export function resetConfig() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

/**
 * Ephemeral session state — lives only for the lifetime of this page load.
 *
 * @type {{
 *   urgencyIndex: number,
 *   selectedNeedIds: string[],        // FIFO queue, max 3
 *   fifoWarningShown: boolean,        // true once the 3-cap tooltip has been shown
 * }}
 */
let _session = {
  urgencyIndex: DEFAULT_CONFIG.defaultUrgencyIndex,
  selectedNeedIds: [],
};

export function getSession() {
  return { ..._session };
}

/** Merge a partial patch into session state. */
export function updateSession(patch) {
  _session = { ..._session, ...patch };
}

// ── Backup / Restore ─────────────────────────────────────────────────────────

const SNAPSHOT_KEY = 'somatic_config_pre_import';

/**
 * Serialize the full AppConfig to a base64 string for backup.
 * Strips _version (re-added on restore), excludes session state.
 * @param {object} config
 * @returns {string} base64 blob
 */
export function serializeConfig(config) {
  const { _version, ...clean } = config;
  const payload = { ...clean, _version: SCHEMA_VERSION };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

/**
 * Deserialize a base64 backup blob back to an AppConfig.
 * Throws a human-readable Error if the blob is invalid or version-mismatched.
 * @param {string} blob
 * @returns {object} AppConfig
 */
export function deserializeConfig(blob) {
  let payload;
  try {
    payload = JSON.parse(decodeURIComponent(escape(atob(blob.trim()))));
  } catch {
    throw new Error('Invalid backup code — could not decode.');
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup code.');
  }
  if (payload._version !== SCHEMA_VERSION) {
    throw new Error(
      'This backup was made with a different version of Somatic and can\'t be restored.'
    );
  }
  if (!Array.isArray(payload.urgencyLevels) || !Array.isArray(payload.needs)) {
    throw new Error('Backup code is missing required data.');
  }
  return payload;
}

/**
 * Save the current config as a pre-import snapshot (for 48-hour undo).
 * Overwrites any existing snapshot.
 * @param {object} config
 */
export function savePreImportSnapshot(config) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      config,
      timestamp: Date.now(),
    }));
  } catch {}
}

/**
 * Get the pre-import snapshot if it exists and is less than 48 hours old.
 * Returns null if no snapshot or snapshot is expired.
 * Also silently deletes expired snapshots.
 * @returns {{ config: object, timestamp: number } | null}
 */
export function getPreImportSnapshot() {
  try {
    const stored = localStorage.getItem(SNAPSHOT_KEY);
    if (!stored) return null;
    const snapshot = JSON.parse(stored);
    const age = Date.now() - snapshot.timestamp;
    if (age > 48 * 60 * 60 * 1000) {
      localStorage.removeItem(SNAPSHOT_KEY);
      return null;
    }
    return snapshot;
  } catch {
    return null;
  }
}

/**
 * Clear the pre-import snapshot.
 */
export function clearPreImportSnapshot() {
  try { localStorage.removeItem(SNAPSHOT_KEY); } catch {}
}
