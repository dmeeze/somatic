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
  urgencyLevels: UrgencyLevel[];   // exactly 5 items; fixed count, labels/icons editable
  defaultUrgencyIndex: number;     // 0–4; which level is selected on session start (default: 2)
  needs: NeedCard[];               // 1–12 items; exactly one has isSomethingElse: true
  maxSelectedNeeds: 3;             // fixed at 3; not user-configurable
  activeThemeId: string;
  themes: Theme[];                 // built-ins + user-created
  ui: UIPrefs;
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
    // Urgency slider gradient — exactly 5 stops regardless of level count
    urgencyGradient: [string, string, string, string, string]; // low → high
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
  keepScreenOn: boolean;  // uses Wake Lock API if available; always active on CommunicationCard
  // Note: no PIN protection — settings are openly accessible
}
```

---

## 6. Screen Designs

### 6.1 Home Screen — Portrait

```
┌──────────────────────────────┐  ← full viewport height
│  [⚙]                        │  top-right gear icon (28px touch target padded)
│                              │
│  ┌────────────────────────┐  │
│  │   URGENCY SLIDER  25%  │  │  — see §6.2
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   NEEDS GRID  50%      │  │  — see §6.3
│  │   (4 × 3 max)          │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   [ SHOW CARD ]  25%   │  │  — see §6.4
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 6.1b Home Screen — Landscape

```
┌─────────────────────────────────────────────┐
│ [⚙]                                         │
│  ┌──────────────┐  ┌───────────────────────┐│
│  │              │  │                       ││
│  │   URGENCY    │  │   NEEDS GRID (4×3)    ││
│  │   SLIDER     │  │                       ││
│  │  (vertical)  │  │                       ││
│  │   40% w      │  │   60% w               ││
│  │              │  ├───────────────────────┤│
│  │              │  │  [ SHOW CARD ]        ││
│  └──────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────┘
```

In landscape, the urgency slider rotates 90° and runs bottom (calm) to top (crisis) — consistent with the spatial metaphor of escalating intensity.

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

- The track is a **colour gradient** derived from `urgencyGradient[0]` → `urgencyGradient[4]`.
- The thumb is large (48 × 48 px) with the current icon centred inside it.
- Tick marks appear at each level position regardless of track length.
- Labels appear below each tick; they truncate to 2 lines with ellipsis.
- The current level label is repeated in a prominent display box below the slider so it is clear even at a glance.
- If only 2 levels are configured the slider becomes a toggle. If 3–5 levels are configured it becomes a stepped slider with snapping.
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
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  📞       │ │  💧       │ │  🚶       │ │  ···     │
│          │ │          │ │          │ │          │
│ Contact  │ │ Water    │ │ Move /   │ │Something │
│ parents  │ │          │ │ walk     │ │ else…    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

- Grid is **CSS Grid** `repeat(4, 1fr)` × rows auto-generated, capped at 3 rows (12 cards max).
- Each card: icon (Font Awesome, 2rem) on top, label below (max 3 lines, then ellipsis).
- **Selected state:** card background shifts to `accentPrimary`, icon/text invert or shift to `cardText`.
- Multiple cards can be selected simultaneously.
- **Something else card:** tapping it opens the Custom Need Dialog (§6.6) before selecting.
- If fewer than 12 cards are enabled, the grid still renders as 4 columns; trailing cells are empty.
- On very small screens (< 360px wide) grid collapses to 3 columns.

### 6.4 Show Card Button

- Full-width, prominent, bottom 25% of screen.
- Label: **"Show Card"** in large bold text + icon `fa-id-card`.
- **Always enabled** — urgency is always set (defaults to configured default level), so the button is never blocked. The user can tap Show Card immediately without selecting any need.
- Background colour: `accentPrimary`.
- Pressing triggers a brief full-screen flash (150ms) then navigates to the Communication Card.

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
  URGENCY LEVELS  (fixed at 5 — edit labels and icons only)

  ≡  😊  I am happy!              [edit]
  ≡  😐  I am ok                  [edit]
  ≡  😬  I am stressed  ★ default [edit]
  ≡  😰  I am about to …          [edit]
  ≡  🌀  I am having a meltdown   [edit]

  Default level: [ I am stressed ▾ ]
```

- Levels are **fixed at 5**. There is no add or delete; only labels and icons can be changed.
- `≡` drag handle for reordering (all 5 can be reordered; the default level follows its item, not its position).
- Edit opens an inline form: text field + Font Awesome icon picker (searchable list of ~100 curated face/emotion icons).
- **Default level** dropdown lets the user choose which of the 5 levels is pre-selected at session start. Currently selected default is marked with ★.
- Changes are live-previewed on the slider at the bottom of the settings screen.

### 7.2 Need Cards Editor

```
  NEED CARDS (1 minimum, 12 maximum)

  ≡  🔇  Quiet space              [edit] [🗑] [show/hide]
  ≡  ❓  Question…                [edit] [🗑] [show/hide]
  …
  ≡  ···  Something else…         [edit icon only]

  [+ Add card]   (disabled when 12 cards exist)
```

- Same drag-to-reorder pattern.
- **Show/hide toggle** — hides from grid without deleting (useful for temporarily irrelevant cards).
- The "Something else" card cannot be deleted or hidden, only have its label and icon edited.
- Edit form: text field + icon picker (broader icon set: ~200 curated icons across categories).

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
- **Urgency gradient**: 5 colour stops, each with an individual picker
- **Typography**: dropdown of ~12 font pairings (each pairing is a heading/body pair from Google Fonts)
- **Shape**: radio group (Sharp / Soft / Round)
- Live preview panel (scrollable, shows Home screen mock and Card mock)
- Save / Cancel

### 7.5 Theme Import / Export

- **Export**: tapping "Export" copies the base64 theme string to clipboard and shows it in a modal with a copy button and a QR code (using a lightweight client-side QR library).
- **Import**: a text field + paste button. On paste, the string is validated, a preview is shown, and the user can confirm or cancel import.

---

## 8. Built-in Themes (Specifications)

All themes pass WCAG AA contrast for body text. Card backgrounds are validated for 4.5:1+ contrast ratio against card text.

### 8.1 Kawaii Pastels

| Token | Value |
|---|---|
| `pageBg` | `#FFF0F6` |
| `surfaceBg` | `#FFFFFF` |
| `textPrimary` | `#4A2040` |
| `textMuted` | `#9E6580` |
| `accentPrimary` | `#FF85B3` |
| `accentSecondary` | `#B5DEFF` |
| `urgencyGradient` | `#A8EDCC`, `#FFE18A`, `#FFBE7A`, `#FF9999`, `#FF6B8A` |
| `cardBg` | `#3D1035` |
| `cardText` | `#FFEEF7` |
| `cardAccent` | `#FF85B3` |
| `pairing` | friendly (Nunito / Nunito) |
| `scale` | large |
| `radius` | round |

### 8.2 Dark Gothic

| Token | Value |
|---|---|
| `pageBg` | `#0D0A0E` |
| `surfaceBg` | `#1C1520` |
| `textPrimary` | `#D4C5DE` |
| `textMuted` | `#6B5778` |
| `accentPrimary` | `#8B1A2F` |
| `accentSecondary` | `#4B0082` |
| `urgencyGradient` | `#2A1F3D`, `#4B0082`, `#7B1FA2`, `#B71C1C`, `#FF0000` |
| `cardBg` | `#1C0A12` |
| `cardText` | `#F5E6FF` |
| `cardAccent` | `#CC2244` |
| `pairing` | ornate (Cinzel / Crimson Text) |
| `scale` | default |
| `radius` | sharp |

### 8.3 Bright Sunny

| Token | Value |
|---|---|
| `pageBg` | `#FFFDE7` |
| `surfaceBg` | `#FFFFFF` |
| `textPrimary` | `#1A237E` |
| `textMuted` | `#5C6BC0` |
| `accentPrimary` | `#FF8F00` |
| `accentSecondary` | `#0288D1` |
| `urgencyGradient` | `#69F0AE`, `#FFEE58`, `#FFA726`, `#EF5350`, `#B71C1C` |
| `cardBg` | `#0D47A1` |
| `cardText` | `#FFFFFF` |
| `cardAccent` | `#FFD600` |
| `pairing` | friendly (Nunito / Nunito) |
| `scale` | large |
| `radius` | round |

### 8.4 Muted Natural

| Token | Value |
|---|---|
| `pageBg` | `#F5F0E8` |
| `surfaceBg` | `#EDE8DC` |
| `textPrimary` | `#2C2416` |
| `textMuted` | `#6B5E42` |
| `accentPrimary` | `#4E6B3A` |
| `accentSecondary` | `#8D6E4A` |
| `urgencyGradient` | `#A5C98A`, `#D4C87A`, `#C4A05A`, `#B06040`, `#8B2020` |
| `cardBg` | `#2C3A1E` |
| `cardText` | `#F0EBD8` |
| `cardAccent` | `#8DC870` |
| `pairing` | editorial (Playfair Display / Lora) |
| `scale` | default |
| `radius` | soft |

### 8.5 Medieval Fantasy

| Token | Value |
|---|---|
| `pageBg` | `#1A1208` |
| `surfaceBg` | `#2C1F0E` |
| `textPrimary` | `#E8D5A0` |
| `textMuted` | `#A0885A` |
| `accentPrimary` | `#C8A020` |
| `accentSecondary` | `#8B2020` |
| `urgencyGradient` | `#2A5C2A`, `#6B8B20`, `#C8A020`, `#C84820`, `#8B0000` |
| `cardBg` | `#0E0A02` |
| `cardText` | `#F0E0A0` |
| `cardAccent` | `#D4AF37` |
| `pairing` | ornate (Cinzel / Crimson Text) |
| `scale` | default |
| `radius` | sharp |

### 8.6 Literary

| Token | Value |
|---|---|
| `pageBg` | `#F8F0E3` |
| `surfaceBg` | `#EDE0C8` |
| `textPrimary` | `#2B1B0E` |
| `textMuted` | `#7A5C3A` |
| `accentPrimary` | `#6B2020` |
| `accentSecondary` | `#3A5C6B` |
| `urgencyGradient` | `#D4E8C8`, `#E8D8A0`, `#D4A860`, `#C06040`, `#8B1A1A` |
| `cardBg` | `#2B1B0E` |
| `cardText` | `#F8F0E3` |
| `cardAccent` | `#C8A040` |
| `pairing` | editorial (Playfair Display / Lora) |
| `scale` | default |
| `radius` | sharp |

### 8.7 Athletic

| Token | Value |
|---|---|
| `pageBg` | `#F5F5F5` |
| `surfaceBg` | `#FFFFFF` |
| `textPrimary` | `#111111` |
| `textMuted` | `#555555` |
| `accentPrimary` | `#E53935` |
| `accentSecondary` | `#1565C0` |
| `urgencyGradient` | `#43A047`, `#FDD835`, `#FB8C00`, `#E53935`, `#880E4F` |
| `cardBg` | `#111111` |
| `cardText` | `#FFFFFF` |
| `cardAccent` | `#E53935` |
| `pairing` | sport (Barlow Condensed / Barlow) |
| `scale` | default |
| `radius` | sharp |

### 8.8 Aircraft

| Token | Value |
|---|---|
| `pageBg` | `#EAF4FB` |
| `surfaceBg` | `#FFFFFF` |
| `textPrimary` | `#0D2137` |
| `textMuted` | `#4A6880` |
| `accentPrimary` | `#1565C0` |
| `accentSecondary` | `#00838F` |
| `urgencyGradient` | `#80DEEA`, `#80CBC4`, `#FFD54F`, `#FF8A65`, `#EF5350` |
| `cardBg` | `#0D2137` |
| `cardText` | `#E8F4FD` |
| `cardAccent` | `#40C4FF` |
| `pairing` | technical (Exo 2 / Exo 2) |
| `scale` | default |
| `radius` | soft |

### 8.9 Space

| Token | Value |
|---|---|
| `pageBg` | `#050816` |
| `surfaceBg` | `#0D1530` |
| `textPrimary` | `#E8EEFF` |
| `textMuted` | `#6A82B4` |
| `accentPrimary` | `#7C4DFF` |
| `accentSecondary` | `#00BCD4` |
| `urgencyGradient` | `#1A237E`, `#4527A0`, `#880E4F`, `#C62828`, `#FF1744` |
| `cardBg` | `#020410` |
| `cardText` | `#E8EEFF` |
| `cardAccent` | `#7C4DFF` |
| `pairing` | cosmic (Orbitron / Rajdhani) |
| `scale` | default |
| `radius` | sharp |

### 8.10 Science

| Token | Value |
|---|---|
| `pageBg` | `#F5F9FF` |
| `surfaceBg` | `#FFFFFF` |
| `textPrimary` | `#0A1628` |
| `textMuted` | `#4A6080` |
| `accentPrimary` | `#0077B6` |
| `accentSecondary` | `#2DC653` |
| `urgencyGradient` | `#00B4D8`, `#90E0EF`, `#FFB703`, `#FB8500`, `#D62828` |
| `cardBg` | `#0A1628` |
| `cardText` | `#E8F4FF` |
| `cardAccent` | `#00B4D8` |
| `pairing` | technical (Exo 2 / Exo 2) |
| `scale` | default |
| `radius` | soft |

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

Using **Workbox** (via `vite-plugin-pwa`) with a cache-first strategy for all assets. All fonts, icons (Font Awesome), and app assets are pre-cached on install.

- App shell cached on first load.
- Config is in `localStorage` — always up to date.
- Font Awesome is self-hosted (not CDN) so it is fully offline-capable.

### 9.3 Platform Behaviour

| Platform | Install UX |
|---|---|
| iOS Safari | "Add to Home Screen" prompt in share sheet; shown via `beforeinstallprompt` polyfill guidance |
| Android Chrome | Native "Install app" banner / `beforeinstallprompt` event |
| Desktop Chrome | Address bar install icon |
| Other browsers | Fallback instructions shown on first visit |

A first-visit overlay (dismissable, shown only once) explains installation with platform-appropriate steps.

---

## 10. Tech Stack Recommendation

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **React 18 + TypeScript** | Component model suits the UI; TS catches config shape errors |
| Build tool | **Vite** | Fast dev server; native ESM |
| PWA | **vite-plugin-pwa** (Workbox) | Zero-config service worker + manifest injection |
| Styling | **CSS Modules + CSS custom properties** | Theming via custom properties on `:root`; no runtime CSS-in-JS overhead |
| Icons | **Font Awesome 6 Free** (self-hosted SVG sprites) | Offline; consistent; well-curated |
| Fonts | **Fontsource** (npm packages) | Self-hosted Google Fonts; tree-shakeable; offline-safe |
| State | **React Context + useReducer** | No external state library needed at this scope |
| Persistence | **localStorage** (via a thin typed wrapper) | Single JSON document; easy import/export |
| QR generation | **qrcode** (npm, ~10kb) | For theme export QR codes |
| Drag-to-reorder | **@dnd-kit/core + @dnd-kit/sortable** | Accessible; touch-friendly; no jQuery |
| Testing | **Vitest + React Testing Library** | Co-located with Vite |

**No server. No auth. No database.** The entire app ships as a static site that can be hosted on GitHub Pages, Netlify, Vercel, or self-hosted on any web server.

---

## 11. Component Tree (High Level)

```
<App>
  <ThemeProvider>          — injects CSS custom properties from activeTheme
    <Router>               — hash-based; no server routing needed
      <HomeScreen>
        <UrgencySlider />
        <NeedsGrid>
          <NeedCard /> × n
          <SomethingElseCard />
        </NeedsGrid>
        <ShowCardButton />
        <SettingsNavButton />
      </HomeScreen>

      <CommunicationCard>  — full-screen overlay route
        <CardUrgency />
        <CardNeedList />
        <CloseButton />
      </CommunicationCard>

      <SettingsScreen>
        <UrgencyLevelsEditor>
          <LevelRow />
          <AddLevelButton />
        </UrgencyLevelsEditor>
        <NeedCardsEditor>
          <NeedRow />
          <AddNeedButton />
        </NeedCardsEditor>
        <ThemeGallery>
          <ThemeCard />
          <ThemeEditor />
          <ThemeImportExport />
        </ThemeGallery>
        <UIPrefsEditor />
      </SettingsScreen>
    </Router>

    <CustomNeedDialog />    — portal modal, shown on demand
    <InstallBanner />       — shown on first visit if not installed
  </ThemeProvider>
</App>
```

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
- **Urgency levels**: fixed at exactly 5; labels and icons are editable but levels cannot be added or removed.

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
| 7 | Font offline strategy | **Bundle all fonts** at install time via Fontsource npm packages. Full offline from first load. |
| 8 | Minimum urgency levels | **Fixed at 5 levels.** No ability to add or remove levels; only labels and icons are editable. |

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

## 15. File Structure (Proposed)

```
somatic/
├── public/
│   ├── icons/               # PWA icons (192, 512, 180)
│   ├── fonts/               # Self-hosted Font Awesome + Google Fonts
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── UrgencySlider/
│   │   ├── NeedsGrid/
│   │   ├── NeedCard/
│   │   ├── ShowCardButton/
│   │   ├── CommunicationCard/
│   │   ├── CustomNeedDialog/
│   │   ├── settings/
│   │   │   ├── UrgencyLevelsEditor/
│   │   │   ├── NeedCardsEditor/
│   │   │   ├── ThemeGallery/
│   │   │   ├── ThemeEditor/
│   │   │   └── ThemeImportExport/
│   │   └── shared/          # Button, Modal, IconPicker, DragHandle…
│   ├── context/
│   │   ├── AppConfigContext.tsx
│   │   └── SessionContext.tsx
│   ├── data/
│   │   ├── defaultConfig.ts
│   │   └── builtInThemes.ts
│   ├── hooks/
│   │   ├── useWakeLock.ts
│   │   ├── useHaptic.ts
│   │   └── useTheme.ts
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── CommunicationCardScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── types/
│   │   └── index.ts         # AppConfig, Theme, UrgencyLevel, NeedCard …
│   ├── utils/
│   │   ├── storage.ts       # typed localStorage wrapper
│   │   ├── themeSerializer.ts
│   │   └── contrast.ts      # WCAG ratio checker for theme editor
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css            # CSS custom properties + global reset
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

*End of design proposal. Awaiting review and approval before implementation begins.*
