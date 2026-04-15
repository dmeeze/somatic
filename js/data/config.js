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
    { id: 'u1', label: 'I am happy!',                   icon: 'fas fa-smile-beam' },
    { id: 'u2', label: 'I am ok',                        icon: 'fas fa-meh' },
    { id: 'u3', label: 'I am stressed',                  icon: 'fas fa-grimace' },
    { id: 'u4', label: 'I am about to have a meltdown',  icon: 'fas fa-sad-cry' },
    { id: 'u5', label: 'I am having a meltdown',         icon: 'fas fa-dizzy' },
  ],

  defaultUrgencyIndex: 2, // 0-based → "I am stressed"

  needs: [
    { id: 'n1', label: 'I have a question but cannot ask it right now', icon: 'fas fa-question-circle',    isSomethingElse: false, enabled: true },
    { id: 'n2', label: 'I need a quiet space',                          icon: 'fas fa-deaf',               isSomethingElse: false, enabled: true },
    { id: 'n3', label: 'I need some time',                              icon: 'fas fa-hourglass-half',     isSomethingElse: false, enabled: true },
    { id: 'n4', label: 'I need my self-soothing tools',                 icon: 'fas fa-hand-holding-heart', isSomethingElse: false, enabled: true },
    { id: 'n5', label: 'I need to contact my parents / carer',          icon: 'fas fa-phone',              isSomethingElse: false, enabled: true },
    { id: 'n6', label: 'I need water',                                  icon: 'fas fa-tint',               isSomethingElse: false, enabled: true },
    { id: 'n7', label: 'I need to move / walk',                         icon: 'fas fa-walking',            isSomethingElse: false, enabled: true },
    { id: 'n8', label: 'Something else\u2026',                          icon: 'fas fa-ellipsis-h',         isSomethingElse: true,  enabled: true },
  ],

  activeThemeId: 'kawaii-pastels',

  themes: BUILT_IN_THEMES,

  ui: {
    reduceMotion: false,
    fontSize: 'default',
    keepScreenOn: true,
    fullIconList: false,
  },
};

const STORAGE_KEY = 'somatic_config';
const SCHEMA_VERSION = 3; // bump when DEFAULT_CONFIG shape changes incompatibly

export function getConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
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
 *   somethingElseText: string,        // custom text entered in the dialog
 *   fifoWarningShown: boolean,        // true once the 3-cap tooltip has been shown
 * }}
 */
let _session = {
  urgencyIndex: DEFAULT_CONFIG.defaultUrgencyIndex,
  selectedNeedIds: [],
  somethingElseText: '',
};

export function getSession() {
  return { ..._session };
}

/** Merge a partial patch into session state. */
export function updateSession(patch) {
  _session = { ..._session, ...patch };
}
