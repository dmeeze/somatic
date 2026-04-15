/**
 * themes.js — Theme objects for Stage 1.
 * Only Kawaii Pastels is needed in Stage 1; the full gallery comes in Stage 3.
 */

export const KAWAII_PASTELS = {
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
};

export const BUILT_IN_THEMES = [KAWAII_PASTELS];
