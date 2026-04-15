# Somatic — Design Proposal

> A Progressive Web App for non-verbal communication for teenagers with autism.

---

## 1. Executive Summary

**Somatic** is a fully client-side, offline-capable PWA that gives non-verbal or situationally mute teenagers a fast, dignified way to communicate their emotional state and immediate needs to a caregiver, teacher, or peer. The user selects how they feel on a graduated urgency slider, then taps one or more need cards, and presses **Show Card** — the screen transforms into a high-contrast, full-screen communication card they can simply hold up.

Everything is customisable: labels, urgency levels, need cards, and the entire visual theme. Themes are serialised to a short text string so they can be shared between users and across devices.

---

## 2. Design Principles

1. **Speed first.** In a moment of distress the user should reach the Show Card screen in under 3 taps / 5 seconds from unlock.
2. **No internet required after first install.** All assets cached; settings stored locally.
3. **Dignity.** The UI should not look clinical or childish. The theming system exists specifically to let each user make it feel personal and age-appropriate.
4. **Large touch targets.** Minimum 56 × 56 px interactive area on every control.
5. **Forgiveness.** No destructive action is taken without confirmation. Customisation is always reversible.
6. **Legibility at a glance.** The communication card must be readable by a standing adult from arm's length.

---

## 3. Target Users

| Role | Relationship to app |
|---|---|
| **Primary user** | Teenager with autism; may be non-verbal or situationally mute under stress |
| **Setup user** | Parent, carer, SEN teacher; configures labels and themes |
| **Recipient** | Teacher, peer, stranger; reads the Show Card screen |

The primary and setup user may be the same person (older/more independent users) or different people. The settings area should feel safe and require a deliberate navigation step so it is not accidentally entered during a crisis.

---

## 4. Information Architecture

```
App
├── Home Screen                  (urgency + needs + show card)
│   └── Show Card Screen         (full-screen overlay)
│       └── Custom Need Dialog   (free-text entry, triggered by "Something else" card)
└── Settings Screen
    ├── Urgency Levels           (edit / reorder / add / remove)
    ├── Need Cards               (edit / reorder / add / remove)
    └── Themes
        ├── Gallery              (pick from built-in or saved)
        ├── Theme Editor         (tweak colours / name)
        └── Import / Export      (copy/paste theme string)
```

Navigation from Home → Settings is a single gear-icon button in the corner, small enough not to be accidentally tapped during use but always present. Settings → Home is a back arrow. There is no other navigation.

---

## 5. Data Model

All data lives in `localStorage` under a single `somatic_config` key as a JSON blob.

### 5.1 Top-level config

```ts
interface AppConfig {
  urgencyLevels: UrgencyLevel[];   // 2–9 items; count, labels, and icons are all editable
  defaultUrgencyIndex: number;     // 0–(n-1); which level is selected on session start (default: 2)
  needs: NeedCard[];               // 1–20 items; exactly one has isSomethingElse: true
  maxSelectedNeeds: 3;             // fixed at 3; not user-configurable
  activeThemeId: string;
  themes: Theme[];                 // built-ins + user-created
  ui: UIPrefs;
  schemaVersion: number;           // incremented on breaking config migrations
}
```

### 5.2 UrgencyLevel

```ts
interface UrgencyLevel {
  id: string;           // stable uuid
  label: string;        // displayed on slider and card
  icon: string;         // Font Awesome class e.g. "fa-solid fa-face-smile"
  colorOverride?: string; // optional hex; falls back to theme gradient position
}
```

Defaults (5 levels):

| # | Label | Icon |
|---|---|---|
| 1 | I am happy! | `fa-face-smile-beam` |
| 2 | I am ok | `fa-face-meh` |
| 3 | I am stressed | `fa-face-grimace` |
| 4 | I am about to have a meltdown | `fa-face-anxious-sweat` |
| 5 | I am having a meltdown | `fa-face-dizzy` |

### 5.3 NeedCard

```ts
interface NeedCard {
  id: string;
  label: string;
  icon: string;             // Font Awesome class
  isSomethingElse: boolean; // exactly one card; opens free-text dialog
  enabled: boolean;         // hidden from grid when false without deleting
}
```

Defaults (8 cards — room for 4 user additions before the 12-card maximum):

| Label | Icon |
|---|---|
| I have a question but cannot ask it right now | `fa-circle-question` |
| I need a quiet space | `fa-ear-deaf` |
| I need some time | `fa-hourglass-half` |
| I need my self-soothing tools | `fa-hand-holding-heart` |
| I need to contact my parents / carer | `fa-phone` |
| I need water | `fa-droplet` |
| I need to move / walk | `fa-person-walking` |
| Something else… | `fa-ellipsis` (isSomethingElse: true) |

### 5.4 Theme

```ts
interface Theme {
  id: string;
  name: string;
  builtIn: boolean;
  colors: {
    // Page backgrounds
    pageBg: string;          // hex
    surfaceBg: string;       // card / panel background
    // Text
    textPrimary: string;
    textMuted: string;
    // Interactive
    accentPrimary: string;   // buttons, active states
    accentSecondary: string; // secondary actions
    // Urgency slider gradient — always exactly 3 stops regardless of level count:
    // [calm, midpoint, crisis]. Interpolated at render time to N stops.
    urgencyGradient: [string, string, string]; // low → mid → high
    // Communication card (must pass WCAG AA against white or black text)
    cardBg: string;
    cardText: string;
    cardAccent: string;
  };
  typography: {
    pairing: "friendly" | "ornate" | "editorial" | "sport" | "technical" | "cosmic";
    // friendly   → Nunito / Nunito         (Kawaii Pastels, Bright Sunny)
    // ornate     → Cinzel / Crimson Text   (Dark Gothic, Medieval Fantasy)
    // editorial  → Playfair Display / Lora (Muted Natural, Literary)
    // sport      → Barlow Condensed/Barlow (Athletic)
    // technical  → Exo 2 / Exo 2          (Aircraft, Science)
    // cosmic     → Orbitron / Rajdhani    (Space)
    scale: "compact" | "default" | "large";
  };
  shape: {
    radius: "sharp" | "soft" | "round"; // 0px / 12px / 24px
  };
  serialized?: string;       // set on export; base64-encoded JSON of the above
}
```

Themes are **serialised** by base64-encoding the JSON of the `Theme` object (minus the `serialized` field itself and `builtIn`). The resulting string is the **share code**. Import parses this string and saves as a user theme.

### 5.5 UIPrefs

```ts
interface UIPrefs {
  reduceMotion: boolean;
  fontSize: "default" | "large" | "xlarge";
  keepScreenOn: boolean;    // uses Wake Lock API if available; always active on CommunicationCard
  fullIconList: boolean;    // when true, icon picker loads all 1,853 FA Pro icons for browsing
  // Note: no PIN protection — settings are openly accessible
}
```

---

## 6. Screen Designs

### 6.1 Home Screen — Portrait

```
┌──────────────────────────────┐  ← full viewport height
│                              │
│  ┌────────────────────────┐  │
│  │   URGENCY SLIDER  ~25% │  │  — see §6.2 (label: "I AM STRESSED")
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   I WANT TO SAY        │  │  ← section heading
│  │                        │  │
│  │   NEEDS GRID  ~50%     │  │  — see §6.3 (4 × n, max 20 cards)
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌──────┬────────────┬─────┐ │
│  │  ⚙   │ ··· SE     │Show │ │  — bottom bar; see §6.4
│  └──────┴────────────┴─────┘ │
└──────────────────────────────┘
```

### 6.1b Home Screen — Landscape (phone)

```
┌─────────────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────────────────┐│
│  │  I AM        │  │   I WANT TO SAY       ││
│  │  STRESSED    │  │                       ││
│  │   URGENCY    │  │   NEEDS GRID (5×n)    ││
│  │   SLIDER     │  │                       ││
│  │  (vertical)  │  ├───────────────────────┤│
│  │   ~35% w     │  │  [⚙] [··· SE] [Show] ││
│  └──────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────┘
```

In landscape, the urgency slider rotates 90° and runs bottom (calm) to top (crisis) — consistent with the spatial metaphor of escalating intensity. Two compact variants exist: `phone-landscape` (≥667 px wide, ≥375 px tall) and `phone-landscape-compact` (shorter screens). Tablet landscape (`tablet-landscape`, ≥1024 px wide) uses the same two-column layout but with a horizontal slider.

### 6.1c Responsive Layout Modes

Five discrete layout modes are detected on boot and on resize/orientation change. The `<body>` element carries a `data-layout` attribute which CSS uses for per-mode overrides.

| Mode | Trigger | Slider orientation |
|---|---|---|
| `phone-portrait` | width < 768 px, portrait | horizontal |
| `phone-landscape` | width ≥ 667 px, height ≥ 375 px, landscape | vertical |
| `phone-landscape-compact` | width ≥ 667 px, height < 375 px, landscape | vertical |
| `tablet-portrait` | width ≥ 768 px, portrait | horizontal |
| `tablet-landscape` | width ≥ 1024 px, landscape | horizontal |

### 6.2 Urgency Slider Component

```
 😊         😐         😬         😰         🌀
  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
  I am      I am       I am      About to   Having a
  happy!    ok         stressed  meltdown   meltdown

  ╔══════════════════════════════╗
  ║  I am stressed               ║   ← current level, large text
  ╚══════════════════════════════╝
```

- The track is a **colour gradient** derived from `urgencyGradient[0]` (calm) → `urgencyGradient[1]` (mid) → `urgencyGradient[2]` (crisis), piecewise-interpolated at render time to produce exactly N colour stops for N urgency levels.
- The thumb is large (48 × 48 px) with the current icon centred inside it.
- Tick marks appear at each level position regardless of track length.
- Labels appear below each tick; they truncate to 2 lines with ellipsis.
- The current level label is repeated in a prominent display box above/beside the slider (matching the "I WANT TO SAY" heading style) so it is clear even at a glance.
- The slider is a stepped `<input type="range">` with snapping; the step count equals the number of urgency levels (2–9).
- Dragging gives haptic feedback (Vibration API, single 10ms pulse per tick).

### 6.3 Needs Grid

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  🔇       │ │  ❓       │ │  ⌛       │ │  🤲       │
│          │ │          │ │          │ │          │
│ Quiet    │ │ Question │ │ Need     │ │ Self-    │
│ space    │ │ (can't   │ │ time     │ │ soothing │
│          │ │ ask now) │ │          │ │ tools    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│  📞       │ │  💧       │  …up to 20 cards total
│          │ │          │
│ Contact  │ │ Water    │
│ parents  │ │          │
└──────────┘ └──────────┘
```

- Grid is **CSS Grid** `repeat(4, 1fr)` × rows auto-generated (20 cards max).
- Each card: icon (Font Awesome, 2rem) on top, label below (max 3 lines, then ellipsis).
- **Selected state:** card background shifts to `accentPrimary`, icon/text invert or shift to `cardText`.
- Multiple cards can be selected simultaneously (capped at 3).
- **"Something else" is not shown in the grid** — it has its own button in the bottom bar (§6.4).
- On very small screens (< 360px wide) grid collapses to 3 columns.

### 6.4 Bottom Bar

The bottom bar is a fixed three-slot row at the base of the home screen. All three buttons share the same height (72 px).

```
┌──────────┬─────────────────────┬──────────────────────────┐
│   ⚙      │  ···  Something else │  🪪  Show               │
│ settings │  (or custom label)  │       (full width)       │
└──────────┴─────────────────────┴──────────────────────────┘
```

- **Settings button** (left): gear icon; opens `#settings`.
- **Something Else button** (centre): `···` icon + label. Tapping opens the Custom Need Dialog (§6.6). When selected, button background shifts to `accentPrimary` and label shows the typed text. Tapping again deselects.
- **Show Card button** (right, dominant): always enabled; triggers a 150 ms full-screen flash then opens the Communication Card. Background: `accentPrimary`.

### 6.5 Communication Card Screen

```
┌──────────────────────────────┐
│                           ✕  │  ← small close button, top-right
│                              │
│   😬                         │
│                              │
│   I am stressed              │  ← urgency level, very large (clamp 2.5rem–5rem)
│   ──────────────────────     │
│                              │
│   🔇  I need a quiet space   │  ← each selected need, large (1.8rem–3rem)
│   ⌛  I need some time       │
│                              │
│                              │
│   [    Close    ]            │  ← large close button at bottom for easy dismissal
└──────────────────────────────┘
```

- Background: `cardBg` (chosen per theme for maximum contrast).
- Text: `cardText`.
- The urgency level name is the largest element.
- If multiple needs are selected they are listed vertically with icons.
- If the "Something else" custom text was entered, it appears as a need line.
- Font size scales with number of items: fewer items = larger text.
- **Tap anywhere on the card (except close button)** does nothing — prevents accidental dismissal during use.
- Close button returns to Home; selected urgency/needs are cleared.
- **Wake Lock API** is requested when card opens (keeps screen on); released on close.
- Orientation is not locked — user may be rotating the device to show to someone.

### 6.6 Custom Need Dialog

A bottom-sheet modal triggered when "Something else" is tapped.

```
╔═══════════════════════════════╗
║  What do you need?            ║
║  ┌─────────────────────────┐  ║
║  │                         │  ║
║  └─────────────────────────┘  ║
║   [ Cancel ]   [ Select ]     ║
╚═══════════════════════════════╝
```

- Single `<textarea>` (2 rows, auto-expand to 4 rows).
- Input is ephemeral — not persisted across sessions.
- "Select" closes the dialog, marks the Something Else card as selected, and stores the text in app state for the card.
- Keyboard is auto-focused on open.

---

## 7. Settings Screen

Navigation: gear icon on Home → Settings (slide-in transition).

### 7.1 Urgency Levels Editor

```
  URGENCY LEVELS  (2–9 levels; add, remove, reorder, edit)

  ≡  😊  I am happy!              [edit]
  ≡  😐  I am ok                  [edit]
  ≡  😬  I am stressed  ★ default [edit]
  ≡  😰  I am about to …          [edit]
  ≡  🌀  I am having a meltdown   [edit]

  [ + Add level ]   (disabled at 9)

  Default level: [ I am stressed ▾ ]
```

- Level count is **user-configurable from 2 to 9**. Levels can be added and removed.
- `≡` drag handle for reordering; the default level follows its item, not its position.
- Edit opens an inline form: text field + Font Awesome icon picker.
- **Default level** dropdown lets the user choose which level is pre-selected at session start.
- Changes are live-previewed on the slider at the bottom of the settings screen.

### 7.2 Need Cards Editor

```
  NEED CARDS (1 minimum, 20 maximum)

  ≡  🔇  Quiet space              [edit] [🗑] [show/hide]
  ≡  ❓  Question…                [edit] [🗑] [show/hide]
  …
  ≡  ···  Something else…         [edit icon only]

  [+ Add card]   (disabled when 20 cards exist)
```

- Same drag-to-reorder pattern.
- **Show/hide toggle** — hides from grid without deleting (useful for temporarily irrelevant cards).
- The "Something else" card cannot be deleted or hidden, only have its label and icon edited.
- Edit form: text field + icon picker. With **Full icon library** enabled, the picker renders all 1,853 FA icons immediately for browsing; search filters the list. With it off, a curated ~200-icon set is shown.

### 7.3 Theme Gallery

```
  THEMES
  
  ● Kawaii Pastels      [preview]   ← currently active
  ○ Dark Gothic         [preview]
  ○ Bright Sunny        [preview]
  ○ Muted Natural       [preview]
  ○ Medieval Fantasy    [preview]
  ○ Literary            [preview]
  ○ Athletic            [preview]
  ○ Aircraft            [preview]
  ○ Space               [preview]
  ○ Science             [preview]
  ─────────────────────────────
    My Themes
  ○ [user theme name]   [preview] [edit] [export] [🗑]

  [Import theme code]
  [Create new theme]
```

- Tapping a theme immediately applies it (live preview of the home screen behind the settings panel).
- Preview shows a small thumbnail with colour swatches and a sample card.

### 7.4 Theme Editor

A full-screen editor with:
- **Name** text field
- **Colour pickers** for each named colour slot (using native `<input type="color">` plus hex input)
- **Urgency gradient**: 3 colour stops (calm / mid / crisis), each with an individual picker
- **Typography**: dropdown of ~12 font pairings (each pairing is a heading/body pair from Google Fonts)
- **Shape**: radio group (Sharp / Soft / Round)
- Live preview panel (scrollable, shows Home screen mock and Card mock)
- Save / Cancel

### 7.5 Theme Import / Export

- **Export**: tapping "Export" copies the base64 theme string to clipboard and shows it in a modal with a copy button and a QR code (using a lightweight client-side QR library).
- **Import**: a text field + paste button. On paste, the string is validated, a preview is shown, and the user can confirm or cancel import.

---

## 8. Built-in Themes

Ten built-in themes cover a range of aesthetics. All pass WCAG AA contrast for body text; card backgrounds are validated for 4.5:1+ contrast against card text. Colour values live in `js/data/themes.js`.

| # | Name | Pairing | Radius |
|---|---|---|---|
| 1 | Kawaii Pastels | Friendly (Nunito) | round |
| 2 | Dark Gothic | Ornate (Cinzel / Crimson Text) | sharp |
| 3 | Bright Sunny | Friendly (Nunito) | round |
| 4 | Muted Natural | Editorial (Playfair Display / Lora) | soft |
| 5 | Medieval Fantasy | Ornate (Cinzel / Crimson Text) | sharp |
| 6 | Literary | Editorial (Playfair Display / Lora) | sharp |
| 7 | Athletic | Sport (Barlow Condensed / Barlow) | sharp |
| 8 | Aircraft | Technical (Exo 2) | soft |
| 9 | Space | Cosmic (Orbitron / Rajdhani) | sharp |
| 10 | Science | Technical (Exo 2) | soft |

---

## 9. PWA Requirements

### 9.1 manifest.json

```json
{
  "name": "Somatic",
  "short_name": "Somatic",
  "description": "Non-verbal communication for teens",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#FFFFFF",
  "theme_color": "#FF85B3",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-180.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```

### 9.2 Service Worker

Hand-written `sw.js`, same pattern as BuzzOff. Cache-first for all assets; cache name includes the git short SHA (injected by the deploy workflow via `sed`) so a new deploy invalidates the old cache automatically.

- All assets (HTML, CSS, JS, fonts, icons, manifest) are pre-cached on install.
- Config is in `localStorage` — never cached by the SW; always current.
- Font Awesome and Google Fonts are self-hosted as static WOFF2 files — fully offline from first install.

### 9.3 Platform Behaviour

| Platform | Install UX |
|---|---|
| iOS Safari | "Add to Home Screen" prompt in share sheet; shown via `beforeinstallprompt` polyfill guidance |
| Android Chrome | Native "Install app" banner / `beforeinstallprompt` event |
| Desktop Chrome | Address bar install icon |
| Other browsers | Fallback instructions shown on first visit |

A first-visit overlay (dismissable, shown only once) explains installation with platform-appropriate steps.

---

## 10. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | **Vanilla HTML / CSS / JS** | No build step; deploy is identical to BuzzOff; nothing to maintain or update |
| Modules | **Native ES modules** (`<script type="module">`) | Browser-native; no bundler; files are `import`/`export` JS without any tooling |
| Styling | **CSS custom properties on `:root`** | Theming is a one-liner (`element.style.setProperty`); zero runtime overhead |
| Icons | **Font Awesome 6 Free** (self-hosted WOFF2 + CSS) | Offline; consistent; no CDN dependency |
| Fonts | **Self-hosted WOFF2 files** (downloaded at dev time, committed to repo) | Fully offline; no npm; no build step; `@font-face` in CSS |
| State | **Plain JS object in memory** | A single `appState` object; no library needed at this scale |
| Persistence | **`localStorage`** | Single JSON blob; trivial read/write |
| QR generation | **`qrcode-generator`** (standalone JS file, ~10 kb) | No npm; self-hosted; works offline |
| Drag-to-reorder | **SortableJS** (standalone JS file, ~25 kb) | No framework required; excellent touch support |
| Service worker | **Hand-written `sw.js`** | Same ~35-line pattern as BuzzOff |

**No framework. No build step. No server. No auth. No database.** The app is a folder of static files deployable anywhere.

---

## 11. Module Structure

Screens are plain `<section>` elements in `index.html`; navigation is show/hide via a CSS class. JS is organised as ES modules imported from `app.js`.

```
app.js                  Entry point. Loads config, applies theme, wires up routing.
│
├── screens/home.js     Renders urgency slider + needs grid + show card button.
│                       Exports: init(), show(), hide()
│
├── screens/card.js     Renders the full-screen communication card overlay.
│                       Exports: show(urgencyLevel, selectedNeeds), hide()
│
├── screens/settings.js Renders all settings panels (levels, needs, themes, prefs).
│                       Exports: init(), show(), hide()
│
├── ui/slider.js        Urgency slider widget — wraps <input type="range">,
│                       draws gradient track, renders tick labels.
│
├── ui/grid.js          Needs grid — builds the 4×n card grid, handles selection
│                       state and the 3-need cap.
│
├── ui/dialog.js        Custom need bottom-sheet + generic modal utility.
│
├── data/config.js      Single source of truth. Holds appState in memory;
│                       reads/writes localStorage. Exports: getConfig(),
│                       saveConfig(), getSession(), updateSession().
│
├── data/themes.js      Built-in theme definitions (the 10 themes from §8)
│                       as plain JS objects.
│
└── utils/
    ├── theme.js        applyTheme(theme, urgencyCount) — writes all colour/font/shape
    │                   tokens to :root; interpolates 3-stop urgencyGradient to N stops.
    ├── serialize.js    exportTheme(theme) → base64 string; importTheme(str) → Theme.
    ├── layout.js       getLayoutMode() → one of 5 mode strings; setLayoutMode() sets
    │                   data-layout on <body>.
    └── contrast.js     wcagRatio(hex1, hex2) → number — used in theme editor.
```

**Routing** is hash-based (`location.hash`): `#home`, `#card`, `#settings`. Each screen module exports `show()` / `hide()`; `app.js` responds to `hashchange` events.

**No virtual DOM. No diffing.** When config changes (e.g. a need label is edited), the relevant screen module's `render()` function clears and rebuilds only its own DOM section — a cheap operation at this scale.

---

## 12. Accessibility

- All interactive elements have visible focus rings (not suppressed).
- `aria-live="polite"` region announces the current urgency level as slider moves.
- Need cards use `role="checkbox"` with `aria-checked` state.
- Communication card has `role="dialog"` with `aria-modal="true"` and `aria-label="Communication card"`.
- Reduce Motion setting disables all CSS transitions/animations.
- Font size setting applies a multiplier to the root font size.
- Touch targets: minimum 56 × 56 px for all interactive elements.
- No gestures that require precision (no swipe-only navigation).
- Settings icon is always visible and never obscured by other UI.

---

## 13. Session Behaviour

- **Urgency slider** defaults to the **configured default level** at session start (initial factory default: level 3, "I am stressed"). The default level is set in Settings and is never empty.
- **Selected needs** are cleared when the Communication Card is closed.
- **Custom "something else" text** is cleared when the Communication Card is closed.
- The app state is therefore ephemeral per-use — configuration is persistent, current selections are not.
- No login, no history, no logs of what was communicated. Privacy by design.
- **Need selection cap**: at most 3 needs can be selected simultaneously. Selecting a 4th deselects the oldest selection (FIFO), with a brief visual indicator explaining the cap on first occurrence.
- **Urgency levels**: configurable from 2 to 9; add, remove, reorder, and edit labels/icons freely.

---

## 14. Resolved Decisions

All open questions have been resolved. These are binding decisions for implementation.

| # | Question | Decision |
|---|---|---|
| 1 | Multi-need selection cap | **Maximum 3 needs** selectable at once. Card remains legible; a distressed user rarely needs to communicate more. |
| 2 | Urgency required vs optional | **Always defaults to a configured level.** The default urgency level is user-configurable; initial default is level 3 ("I am stressed"). The slider is never unset at session start. |
| 3 | Communication card dismissal | **Close button only** (✕ top-right + large Close button at bottom). Tapping the card body does nothing — prevents accidental dismissal while physically showing the device to someone. |
| 4 | Theme sharing | **Text code + QR code.** Both mechanisms are available on the export sheet. |
| 5 | Font pairings | **6 curated pairings, bundled offline via Fontsource.** Themes share pairings where aesthetically compatible (see §8). |
| 6 | Settings PIN | **No PIN.** Settings require deliberate navigation; no lock needed. |
| 7 | Font offline strategy | **All fonts shipped as static WOFF2 files** in `fonts/`, committed to the repo. No npm, no build step. Full offline from first install via service worker pre-cache. |
| 8 | Urgency level count | **Configurable from 2 to 9.** Labels, icons, count, and order are all editable. |

### 14.1 Font Pairings (6 total)

| Pairing | Heading | Body | Used by themes |
|---|---|---|---|
| **Friendly** | Nunito | Nunito | Kawaii Pastels, Bright Sunny |
| **Ornate** | Cinzel | Crimson Text | Dark Gothic, Medieval Fantasy |
| **Editorial** | Playfair Display | Lora | Muted Natural, Literary |
| **Sport** | Barlow Condensed | Barlow | Athletic |
| **Technical** | Exo 2 | Exo 2 | Aircraft, Science |
| **Cosmic** | Orbitron | Rajdhani | Space |

Kawaii Pastels and Bright Sunny share the Friendly pairing but are differentiated entirely by their colour schemes and border radius (round vs round). Dark Gothic and Medieval Fantasy share Ornate but differ in palette. Literary and Muted Natural share Editorial but differ in palette. Aircraft and Science share Technical but differ in palette.

---

## 15. File Structure

No build output directory — what you see is what gets deployed.

```
somatic/
├── icons/
│   ├── icon.svg             # Primary PWA icon
│   ├── icon-maskable.svg    # Maskable variant (Android)
│   └── icon-180.png         # iOS home screen icon
│
├── fonts/
│   ├── fontawesome/         # FA 6 Free web fonts + fa-solid.css etc.
│   ├── nunito/              # Friendly pairing
│   ├── cinzel/              # Ornate pairing (heading)
│   ├── crimson-text/        # Ornate pairing (body)
│   ├── playfair-display/    # Editorial pairing (heading)
│   ├── lora/                # Editorial pairing (body)
│   ├── barlow-condensed/    # Sport pairing (heading)
│   ├── barlow/              # Sport pairing (body)
│   ├── exo-2/               # Technical pairing
│   ├── orbitron/            # Cosmic pairing (heading)
│   └── rajdhani/            # Cosmic pairing (body)
│
├── lib/
│   ├── sortable.min.js      # SortableJS — drag-to-reorder in settings
│   └── qrcode.min.js        # qrcode-generator — theme export QR codes
│
├── js/
│   ├── app.js               # Entry point; routing; boot sequence
│   ├── screens/
│   │   ├── home.js
│   │   ├── card.js
│   │   └── settings.js
│   ├── ui/
│   │   ├── slider.js
│   │   ├── grid.js
│   │   └── dialog.js
│   ├── data/
│   │   ├── config.js
│   │   └── themes.js
│   └── utils/
│       ├── theme.js
│       ├── serialize.js
│       ├── layout.js
│       └── contrast.js
│
├── index.html               # App shell; all three screen sections present,
│                            # shown/hidden via CSS class
├── styles.css               # Global reset, layout, CSS custom property tokens,
│                            # all component styles
├── sw.js                    # Service worker (hand-written; __VERSION__ placeholder)
└── manifest.json            # PWA manifest (start_url placeholder for deploy)
```

The `fonts/` directory is populated once at dev time by downloading WOFF2 releases from Google Fonts and the Font Awesome free web fonts package, then committed to the repo. They are static assets — no npm, no build step.

## 16. Build & Deployment

### 16.1 Overview

Somatic is deployed to **AWS S3 + CloudFront** using the same GitHub Actions pattern as [BuzzOff](https://github.com/dmeeze/buzzoff). Because Somatic is also vanilla HTML/JS/CSS with no build step, the workflow is **identical in structure to BuzzOff's** — checkout, copy files, inject `<base>` tag and version placeholder with `sed`, sync to S3, invalidate CloudFront.

### 16.2 Branches → Environments

| Branch | Environment | Base path | URL |
|---|---|---|---|
| `release` | Production | `/somatic/` | `https://drewmayo.com/somatic/` |
| `staging` | Staging | `/somatic-staging/` | `https://drewmayo.com/somatic-staging/` |

### 16.3 GitHub Actions Workflow

Location: `.github/workflows/deploy-s3.yml`

Structure is identical to BuzzOff. No `npm ci`, no build step — checkout, prepare publish dir with `sed` substitutions, sync to S3, invalidate CloudFront.

```yaml
name: Deploy to S3

on:
  push:
    branches: [ release, staging ]
  workflow_dispatch:
    inputs:
      base_href:
        description: 'Base path for deployment (e.g., /somatic/)'
        required: false
        default: '/somatic/'
      environment:
        description: 'Deployment environment'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4.2.2

      - name: Set deployment variables
        id: vars
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            BASE_HREF="${{ github.event.inputs.base_href }}"
            ENVIRONMENT="${{ github.event.inputs.environment }}"
          elif [ "${{ github.ref }}" = "refs/heads/release" ]; then
            BASE_HREF="/somatic/"
            ENVIRONMENT="production"
          else
            BASE_HREF="/somatic-staging/"
            ENVIRONMENT="staging"
          fi
          echo "base_href=${BASE_HREF}" >> $GITHUB_OUTPUT
          echo "environment=${ENVIRONMENT}" >> $GITHUB_OUTPUT

      - name: Prepare publish directory
        run: |
          VERSION=$(git rev-parse --short HEAD)
          BASE_HREF="${{ steps.vars.outputs.base_href }}"

          mkdir -p publish
          cp -r icons fonts lib js index.html styles.css sw.js manifest.json publish/

          # Inject <base> tag for correct subpath resolution
          sed -i "s|<head>|<head>\n    <base href=\"${BASE_HREF}\">|" publish/index.html

          # Update manifest.json start_url and scope
          sed -i "s|\"start_url\": \"./\"|\"start_url\": \"${BASE_HREF}\", \"scope\": \"${BASE_HREF}\"|" publish/manifest.json

          # Inject git SHA as cache-bust version into sw.js
          sed -i "s|__VERSION__|${VERSION}|g" publish/sw.js

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4.1.0
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Deploy static assets (long cache)
        run: |
          SUBDIR=$(echo "${{ steps.vars.outputs.base_href }}" | sed 's|^/||' | sed 's|/$||')
          aws s3 sync publish/ "s3://${{ secrets.AWS_S3_BUCKET_NAME }}/${SUBDIR}/" \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "*.html" \
            --exclude "manifest.json" \
            --exclude "sw.js"

      - name: Deploy PWA shell files (short cache)
        run: |
          SUBDIR=$(echo "${{ steps.vars.outputs.base_href }}" | sed 's|^/||' | sed 's|/$||')
          aws s3 sync publish/ "s3://${{ secrets.AWS_S3_BUCKET_NAME }}/${SUBDIR}/" \
            --cache-control "public, max-age=300, must-revalidate" \
            --include "*.html" \
            --include "manifest.json" \
            --include "sw.js"

      - name: Invalidate CloudFront cache
        run: |
          SUBDIR=$(echo "${{ steps.vars.outputs.base_href }}" | sed 's|^/||' | sed 's|/$||')
          aws cloudfront create-invalidation \
            --distribution-id "${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }}" \
            --paths "/${SUBDIR}/*"

      - name: Deploy summary
        run: |
          echo "## Deploy Complete" >> $GITHUB_STEP_SUMMARY
          echo "**Environment:** ${{ steps.vars.outputs.environment }}" >> $GITHUB_STEP_SUMMARY
          echo "**Base path:** ${{ steps.vars.outputs.base_href }}" >> $GITHUB_STEP_SUMMARY
          echo "**URL:** https://drewmayo.com${{ steps.vars.outputs.base_href }}" >> $GITHUB_STEP_SUMMARY
```

### 16.4 Local Development

Open `index.html` directly in a browser, or use any static file server (e.g. `python3 -m http.server`). No dev server, no hot reload, no tooling required. ES modules work fine from `file://` in most browsers, but a local HTTP server avoids any CORS edge cases with font loading.

### 16.5 Cache Strategy Rationale

Without a bundler there are no content-hashed filenames, so JS/CSS files use the same short cache as the HTML. The service worker's version string (git SHA) ensures stale assets are evicted on the next SW update cycle.

| File type | Cache-Control | Reason |
|---|---|---|
| `index.html` | `max-age=300` | Entry point; must reflect latest deploy quickly |
| `manifest.json` | `max-age=300` | PWA installer checks this; stale manifest causes install issues |
| `sw.js` | `max-age=300` | Browser re-fetches on page load; stale sw.js blocks updates |
| `js/*.js`, `styles.css` | `max-age=300` | No content hashing; must be re-fetched after deploys |
| `fonts/`, `icons/`, `lib/` | `max-age=31536000, immutable` | These files never change between deploys; safe to cache forever |

### 16.6 Required GitHub Secrets

Same secrets as BuzzOff — no new AWS infrastructure needed if deploying to the same bucket/distribution:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user with S3 write + CloudFront invalidation permissions |
| `AWS_SECRET_ACCESS_KEY` | Corresponding secret |
| `AWS_REGION` | e.g. `ap-southeast-2` |
| `AWS_S3_BUCKET_NAME` | Target S3 bucket |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Distribution serving the bucket |

### 16.7 CloudFront Routing Note

CloudFront must be configured to serve `index.html` for all paths under `/somatic/*` that are not static assets — i.e., a custom error response for 403/404 that serves `index.html` with a 200 status, scoped to the `/somatic/` path prefix. Somatic uses hash-based client-side routing so deep links are not an issue in practice, but the fallback is needed for the PWA start URL.

---

## 17. Development Stages

Each stage produces a fully usable, testable slice of the app. Later stages layer on top without reworking what came before.

---

### Stage 1 — Minimal Working App

**Goal:** a real person can pick an urgency level and a need, and show the card to someone else.

**Includes:**
- `index.html` app shell with the three screen sections (`#home`, `#card`, `#settings` placeholder)
- Home screen: urgency slider (5 hard-coded levels), needs grid (hard-coded default cards), Show Card button
- Communication card full-screen overlay — urgency + up to 3 selected needs displayed; close button only
- Custom need dialog (Something else… card)
- 3-need selection cap with FIFO deselection
- Single built-in theme hard-coded in `styles.css` (Kawaii Pastels as a starting point)
- No persistence — state is in-memory only; reloading resets everything
- No settings screen
- `data/config.js` written with the full data model in place, even though nothing is editable yet — this avoids a rewrite in Stage 2

**Exit criteria:** the core communication loop works end-to-end on a real phone browser.

---

### Stage 2 — Settings: Urgency & Needs Editing

**Goal:** the user (or their carer) can personalise labels, icons, and card order without touching code.

**Includes:**
- Settings screen wired up (gear icon → `#settings`, back → `#home`)
- Urgency levels editor: edit label + icon for each of the 5 levels; drag-to-reorder (SortableJS); default level picker
- Need cards editor: edit label + icon; show/hide toggle; drag-to-reorder; add card (up to 12); delete card (with confirmation)
- Something else card: label and icon editable, cannot be deleted
- Icon picker UI (searchable list of curated Font Awesome icons), shared between urgency and needs editors
- `localStorage` persistence wired into `data/config.js` — all config survives page reload from this stage forward
- UI prefs: reduce motion toggle, font size selector (default / large / x-large)
- Factory reset option (restores default config with confirmation)

**Exit criteria:** a carer can sit down, open Settings, customise all labels to match the user's language, and the changes persist across sessions.

---

### Stage 3 — Themes

**Goal:** the user can make the app feel like theirs.

**Includes:**
- All 6 font pairings downloaded and committed to `fonts/`
- All 10 built-in themes defined in `data/themes.js`
- `utils/theme.js` — `applyTheme()` writes all CSS custom property tokens to `:root`
- Theme gallery in Settings: list of built-in themes + any user themes; tap to apply live
- Theme editor: colour pickers for all named slots + 5 urgency gradient stops; font pairing selector; shape selector (sharp / soft / round); name field; live preview panel showing home mock and card mock
- Theme serialisation (`utils/serialize.js`): export to base64 string; import from string with validation and preview before confirming
- QR code export (`lib/qrcode.min.js`): displayed alongside the text code on the export sheet
- User-created themes stored in config and persisted in `localStorage`

**Exit criteria:** the user can switch to Dark Gothic, tweak the accent colour, save it as "My Theme", export the code, and import it on a different device.

---

### Stage 4 — Deploy & PWA

**Goal:** the app is installable on any device and works fully offline.

**Includes:**
- `manifest.json` with correct icons, `start_url`, `display: standalone`
- PWA icons: `icon.svg`, `icon-maskable.svg`, `icon-180.png`
- `sw.js` — hand-written cache-first service worker; pre-caches all app assets; `__VERSION__` placeholder for cache busting
- Service worker registration in `index.html`
- First-visit install banner: detects `beforeinstallprompt` (Android/desktop) and shows platform-appropriate instructions; dismissed and not shown again
- Wake Lock API in `card.js` — requests screen-on lock when the card opens; releases on close; degrades silently if unavailable
- Haptic feedback in `ui/slider.js` — single 10 ms Vibration API pulse per urgency tick; degrades silently
- `.github/workflows/deploy-s3.yml` — full workflow from §16.3
- Cross-platform smoke test: iOS Safari (add to home screen), Android Chrome (install prompt), Desktop Chrome (address bar install)

**Exit criteria:** the app installs from `https://drewmayo.com/somatic/`, opens standalone, works with airplane mode on, and the communication card keeps the screen on while being shown.

---

*End of design proposal. Awaiting review and approval before implementation begins.*
