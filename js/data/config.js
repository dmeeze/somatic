/**
 * config.js — Full data model + hard-coded defaults.
 * No localStorage in Stage 1. State is in-memory only.
 *
 * Exports:
 *   getConfig()        → deep clone of the default AppConfig
 *   getSession()       → current ephemeral session state
 *   updateSession(patch) → merge patch into session state
 */

/** @type {import('./types').AppConfig} */
const DEFAULT_CONFIG = {
  urgencyLevels: [
    { id: 'u1', label: 'I am happy!',                   icon: 'fa-solid fa-face-smile-beam' },
    { id: 'u2', label: 'I am ok',                        icon: 'fa-solid fa-face-meh' },
    { id: 'u3', label: 'I am stressed',                  icon: 'fa-solid fa-face-grimace' },
    { id: 'u4', label: 'I am about to have a meltdown',  icon: 'fa-solid fa-face-sad-cry' },
    { id: 'u5', label: 'I am having a meltdown',         icon: 'fa-solid fa-face-dizzy' },
  ],

  defaultUrgencyIndex: 2, // 0-based → "I am stressed"

  needs: [
    { id: 'n1', label: 'I have a question but cannot ask it right now', icon: 'fa-solid fa-circle-question',      isSomethingElse: false, enabled: true },
    { id: 'n2', label: 'I need a quiet space',                          icon: 'fa-solid fa-ear-deaf',             isSomethingElse: false, enabled: true },
    { id: 'n3', label: 'I need some time',                              icon: 'fa-solid fa-hourglass-half',       isSomethingElse: false, enabled: true },
    { id: 'n4', label: 'I need my self-soothing tools',                 icon: 'fa-solid fa-hand-holding-heart',   isSomethingElse: false, enabled: true },
    { id: 'n5', label: 'I need to contact my parents / carer',          icon: 'fa-solid fa-phone',                isSomethingElse: false, enabled: true },
    { id: 'n6', label: 'I need water',                                  icon: 'fa-solid fa-droplet',              isSomethingElse: false, enabled: true },
    { id: 'n7', label: 'I need to move / walk',                         icon: 'fa-solid fa-person-walking',       isSomethingElse: false, enabled: true },
    { id: 'n8', label: 'Something else\u2026',                          icon: 'fa-solid fa-ellipsis',             isSomethingElse: true,  enabled: true },
  ],

  activeThemeId: 'kawaii-pastels',

  themes: [
    {
      id: 'kawaii-pastels',
      name: 'Kawaii Pastels',
      builtIn: true,
      colors: {
        pageBg:           '#FFF0F6',
        surfaceBg:        '#FFFFFF',
        textPrimary:      '#4A2040',
        textMuted:        '#9E6580',
        accentPrimary:    '#FF85B3',
        accentSecondary:  '#B5DEFF',
        urgencyGradient:  ['#A8EDCC', '#FFE18A', '#FFBE7A', '#FF9999', '#FF6B8A'],
        cardBg:           '#3D1035',
        cardText:         '#FFEEF7',
        cardAccent:       '#FF85B3',
      },
      typography: {
        pairing: 'friendly',
        scale: 'large',
      },
      shape: {
        radius: 'round',
      },
    },
  ],

  ui: {
    reduceMotion: false,
    fontSize: 'default',
    keepScreenOn: true,
  },
};

const STORAGE_KEY = 'somatic_config';

export function getConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function saveConfig(config) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
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
