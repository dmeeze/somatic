# Somatic — Design Document

> A Progressive Web App for non-verbal communication for teenagers with autism.

---

## 1. Executive Summary

**Somatic** is a fully client-side, offline-capable PWA that gives non-verbal or situationally mute teenagers a fast, dignified way to communicate their emotional state and immediate needs to a caregiver, teacher, or peer. The user selects how they feel on a graduated urgency slider, then taps one or more need cards, and presses **Show Card** — the screen transforms into a high-contrast, full-screen communication card they can simply hold up.

Everything is customisable: labels, urgency levels, need cards, and the entire visual theme. Settings are backed up and restored via a short text code that can be shared between devices.

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
    ├── Themes                   (gallery of built-in themes)
    ├── App                      (backup/restore, font size, factory reset)
    └── Instructions             (usage guidance)
```

Navigation from Home → Settings is a single gear-icon button in the corner, small enough not to be accidentally tapped during use but always present. Settings → Home is a back arrow. There is no other navigation.

---

## 5. Stored Data

All settings live in the browser's localStorage and survive page reloads. Nothing is sent to a server.

**Urgency levels** — An ordered list of 2–9 levels, each with a label, icon, and a unique ID. One level is designated the default (pre-selected at session start). The list can be reordered; reordering preserves the default designation by ID, not position.

**Need cards** — An ordered list of up to 20 regular cards, each with a label, icon, enabled/disabled flag, and a unique ID. Exactly one special card is the "Something else" card — it cannot be deleted, hidden, or reordered, but its label and icon are editable.

**Active theme** — Which built-in theme is currently selected.

**UI preferences** — Font size (default / large / extra-large). Full icon library toggle (shows all 1,853 FA icons in the picker when on; shows a curated set when off).

**Schema versioning** — A version number on the stored data so future incompatible changes can be migrated or cleanly discarded.

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

In landscape, the urgency slider rotates 90° and runs bottom (calm) to top (crisis) — consistent with the spatial metaphor of escalating intensity.

### 6.1c Responsive Layout Modes

Five discrete layout modes are detected on boot and on resize/orientation change.

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

- The track is a **colour gradient** interpolated from the theme's urgency gradient (calm → mid → crisis).
- The thumb is large (48 × 48 px) with the current icon centred inside it.
- Tick marks appear at each level position. Labels below each tick truncate to 2 lines.
- The current level label is repeated in a prominent display box above the slider.
- The slider snaps to discrete steps (one per urgency level).

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

- 4-column grid (3 columns on very small screens); rows auto-generate.
- Each card: icon (large) on top, label below (max 3 lines, then ellipsis).
- **Selected state:** card background shifts to the accent colour.
- Multiple cards can be selected simultaneously (capped at 3).
- **"Something else" is not shown in the grid** — it has its own button in the bottom bar (§6.4).

### 6.4 Bottom Bar

The bottom bar is a fixed three-slot row at the base of the home screen. All three buttons share the same height (72 px).

```
┌──────────┬─────────────────────┬──────────────────────────┐
│   ⚙      │  ···  Something else │  🪪  Show               │
│ settings │  (or custom label)  │       (full width)       │
└──────────┴─────────────────────┴──────────────────────────┘
```

- **Settings button** (left): gear icon; opens `#settings`.
- **Something Else button** (centre): `···` icon + label. Tapping opens the Custom Need Dialog (§6.6). When selected, button background shifts to the accent colour and label shows the typed text. Tapping again deselects.
- **Show Card button** (right, dominant): always enabled; opens the Communication Card screen.

### 6.5 Communication Card Screen

```
┌──────────────────────────────┐
│                           ✕  │  ← small close button, top-right
│                              │
│   😬                         │
│                              │
│   I am stressed              │  ← urgency level, very large
│   ──────────────────────     │
│                              │
│   🔇  I need a quiet space   │  ← each selected need, large
│   ⌛  I need some time       │
│                              │
│                              │
│   [    Close    ]            │  ← large close button at bottom
└──────────────────────────────┘
```

- Background uses the theme's communication card colour (chosen for maximum contrast).
- The urgency level name is the largest element.
- If multiple needs are selected they are listed vertically with icons.
- Font size scales with number of items: fewer items = larger text.
- **Tap anywhere on the card (except close button)** does nothing — prevents accidental dismissal.
- Close button returns to Home; selected urgency/needs are cleared.
- **Wake Lock API** is requested when card opens (keeps screen on); released on close.

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

- Single text area (2 rows, auto-expand to 4 rows).
- Input is ephemeral — not persisted across sessions.
- "Select" marks the Something Else card as selected with the typed text displayed on the card.
- Keyboard is auto-focused on open.

---

## 7. Settings Screen

Navigation: gear icon on Home → Settings.

Settings has five tabs: **Urgency**, **Needs**, **Theme**, **App**, and **Instructions**.

### 7.1 Urgency Levels Editor

```
  URGENCY LEVELS  (2–9 levels; add, remove, reorder, edit)

  ≡  😊  I am happy!              [edit]
  ≡  😐  I am ok                  [edit]
  ≡  😬  I am stressed  Default   [edit]
  ≡  😰  I am about to …          [edit]
  ≡  🌀  I am having a meltdown   [edit]

  [ + Add level ]   (disabled at 9)
```

- 2 to 9 levels, fully editable. Levels can be added, removed, and reordered.
- `≡` drag handle for reordering. The default level badge follows the item by ID, not position.
- Tapping edit opens a modal with a label field, an inline icon mini-picker (a row of common icons plus a "…" button that opens the full searchable picker), and a **"Make default"** button. If the level is already the default, the button shows "Default ✓" and is disabled.
- The current default is shown with a "Default" badge on the list row.

### 7.2 Need Cards Editor

```
  NEED CARDS (1 minimum, 20 maximum)

  ≡  🔇  Quiet space       [show/hide] [edit] [🗑]
  ≡  ❓  Question…         [show/hide] [edit] [🗑]
  …

  [+ Add need]   (disabled when 20 regular cards exist)

  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
    ···  "Something else…"
  │      Always available — edit label & icon  [edit]  │
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

- Regular cards can be reordered by drag, shown/hidden, edited, and deleted.
- **Show/hide toggle** — hides from grid without deleting.
- The **"Something else"** card lives in a separate dashed-border area below the "+ Add need" button. It cannot be deleted, hidden, or reordered — only its label and icon are editable.
- The same inline icon mini-picker is used as in the urgency editor.

### 7.3 Theme Gallery

```
  THEMES

  ○ Kawaii Pastels      [preview]
  ○ Dark Gothic         [preview]
  ● Bright Sunny        [preview]   ← default / currently active
  ○ Muted Natural       [preview]
  …
```

- Ten built-in themes. Tapping a theme immediately applies it.
- Each theme card shows a colour swatch preview (page background, accent, urgency gradient, card colour).
- The active theme is visually highlighted. No checkmark icon — the selected card style is sufficient.
- **Default theme is Bright Sunny.**

### 7.4 App Tab

Contains: backup & restore, font size preference, and factory reset.

**Backup & Restore** — Export serialises all settings to a base64 text code. If the Web Share API is available, it offers the system share sheet; otherwise it copies to clipboard. Import accepts a pasted code, validates it, and asks for confirmation before overwriting current settings. A 48-hour undo window is available after a restore.

**Font size** — Three options: Default, A+, A++. Applies a root font-size multiplier to all text in the app.

**Full icon library** — Toggles whether the icon picker shows the full 1,853-icon set or a curated subset (default: full library shown).

**Factory reset** — Restores all default labels, needs, and settings (theme is preserved). Requires confirmation.

### 7.5 Instructions Tab

A static reference tab describing how to use the key features: urgency levels, need cards, the "Something else" button, and showing the card.

---

## 8. Icon Picker

The icon picker is a modal sheet shared between the urgency level editor and the need card editor.

```
╔══════════════════════════════════════════╗
║  Choose icon                             ║
║  ┌──────────────────────────────────── ┐ ║
║  │  🔍 Search…                     ✕  │ ║
║  └─────────────────────────────────── ┘ ║
║                                          ║
║  😊  😐  😬  😰  🌀  ❓  🔇  ⌛  🤲    ║
║  📞  💧  🏃  ⭐  ⚡  🎵  🛏  🛋  …     ║
║  …                                       ║
╚══════════════════════════════════════════╝
```

- Search filters by icon name/keywords. Icons pack to the top with no whitespace gaps.
- Default mode: curated set of ~74 icons relevant to the app's use case.
- Full library mode (toggled in App settings): all 1,853 Font Awesome Pro icons, browsable and searchable.

**Inline mini-picker** — In the edit modal for urgency levels and need cards, a compact row of 17 icons is shown inline (the first 17 from the current icon list). Tapping one selects it immediately. A "…" button at the end opens the full picker sheet for browsing.

---

## 9. Built-in Themes

Ten built-in themes cover a range of aesthetics. All pass WCAG AA contrast for body text; card backgrounds are validated for 4.5:1+ contrast against card text.

| # | Name | Vibe | Font style |
|---|---|---|---|
| 1 | Kawaii Pastels | Soft pink, playful | Rounded (Nunito) |
| 2 | Dark Gothic | Black with deep purple | Ornate (Cinzel / Crimson Text) |
| 3 | Bright Sunny | Yellow and orange, energetic | Rounded (Nunito) |
| 4 | Muted Natural | Sage greens, earthy | Editorial (Playfair / Lora) |
| 5 | Medieval Fantasy | Parchment and deep red | Ornate (Cinzel / Crimson Text) |
| 6 | Literary | Cream and deep navy | Editorial (Playfair / Lora) |
| 7 | Athletic | Bold black and neon | Sport (Barlow Condensed / Barlow) |
| 8 | Aircraft | Grey and instrument amber | Technical (Exo 2) |
| 9 | Space | Deep black and neon cyan | Cosmic (Orbitron / Rajdhani) |
| 10 | Science | White lab with teal | Technical (Exo 2) |

The **default theme is Bright Sunny** (applied to new installs and after factory reset).

---

## 10. PWA Requirements

### 10.1 Offline

The app is fully usable offline after first install. All assets (HTML, CSS, JS, fonts, icons) are pre-cached by the service worker on first visit. localStorage config survives offline use.

### 10.2 Installability

| Platform | Install UX |
|---|---|
| iOS Safari | "Add to Home Screen" via share sheet |
| Android Chrome | Native "Install app" banner |
| Desktop Chrome | Address bar install icon |

### 10.3 Update Detection

The app actively checks for updates without forcing a disruptive reload mid-session.

A `version.json` file is deployed alongside the app and contains the current build version. The app fetches this file (bypassing the service worker cache) shortly after launch, when the device comes back online, and periodically every 10 minutes. If the fetched version differs from the running version, an unobtrusive **"Somatic has been updated. [Reload]"** banner appears at the bottom of the screen. The user taps "Reload" when ready — no forced auto-reload.

A secondary path: when the service worker updates to a new version and activates, it notifies open app instances, which also triggers the update banner.

Both paths are inactive in development (version tokens are not replaced, so the comparison is always equal and no banner appears).

### 10.4 Screen Wake Lock

The Wake Lock API is requested when the communication card opens, keeping the screen on while being shown to someone. It is released when the card closes. Degrades silently on unsupported browsers.

---

## 11. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | **Vanilla HTML / CSS / JS** | No build step; deploy is identical to BuzzOff; nothing to maintain or update |
| Modules | **Native ES modules** | Browser-native; no bundler; no tooling |
| Styling | **CSS custom properties on `:root`** | Theming is a one-liner; zero runtime overhead |
| Icons | **Font Awesome Pro 5 Free** (self-hosted WOFF2 + CSS) | Offline; consistent; no CDN dependency |
| Fonts | **Self-hosted WOFF2 files** | Fully offline; no npm; no build step |
| State | **Plain JS object in memory** | A single config object; no library needed |
| Persistence | **`localStorage`** | Single JSON blob; trivial read/write |
| Drag-to-reorder | **SortableJS** (standalone JS file) | No framework required; excellent touch support |
| Service worker | **Hand-written `sw.js`** | Cache-first; version placeholder injected at deploy |

**No framework. No build step. No server. No auth. No database.** The app is a folder of static files deployable anywhere.

---

## 12. Module Structure

```
app.js                  Entry point. Loads config, applies theme, wires up routing,
│                       registers service worker, handles update detection.
│
├── screens/home.js     Renders urgency slider + needs grid + show card button.
│
├── screens/card.js     Renders the full-screen communication card overlay.
│
├── screens/settings.js Renders all settings panels (urgency, needs, themes, app, instructions).
│
├── ui/slider.js        Urgency slider widget — wraps range input, draws gradient
│                       track, renders tick labels.
│
├── ui/grid.js          Needs grid — builds the card grid, handles selection state
│                       and the 3-need cap.
│
├── ui/dialog.js        Custom need bottom-sheet + generic confirm modal utility.
│
├── data/config.js      Config persistence — reads/writes localStorage, handles
│                       schema migration, backup/restore serialisation.
│
├── data/themes.js      All 10 built-in theme definitions.
│
├── data/icons.js       Curated icon list (~74 icons) for the default picker.
│
├── data/icons-all.js   Full 1,853-icon list for the full library picker.
│
└── utils/
    ├── theme.js        applyTheme() — writes CSS custom property tokens to :root.
    ├── layout.js       Detects and applies the 5 responsive layout modes.
    └── contrast.js     WCAG contrast ratio utility.
```

Routing is hash-based (`#home`, `#card`, `#settings`). When config changes, only the affected screen section is cleared and rebuilt — no virtual DOM, no diffing.

---

## 13. Accessibility

- All interactive elements have visible focus rings.
- `aria-live` region announces the current urgency level as the slider moves.
- Need cards use `role="checkbox"` with `aria-checked` state.
- Communication card has `role="dialog"` with `aria-modal` and `aria-label`.
- Font size setting applies a multiplier to the root font size.
- Touch targets: minimum 56 × 56 px for all interactive elements.
- No gestures that require precision (no swipe-only navigation).

---

## 14. Session Behaviour

- **Urgency slider** defaults to the configured default level at session start.
- **Selected needs** are cleared when the communication card is closed.
- **Custom "something else" text** is cleared when the communication card is closed.
- The app state is ephemeral per-use — configuration is persistent, current selections are not.
- No login, no history, no logs of what was communicated. **Privacy by design.**
- **Need selection cap**: at most 3 needs can be selected. Selecting a 4th deselects the oldest (FIFO), with a brief visual indicator on first occurrence.

---

## 15. Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Multi-need selection cap | **Maximum 3 needs** selectable at once. Card remains legible; a distressed user rarely needs to communicate more. |
| 2 | Urgency required vs optional | **Always defaults to a configured level.** The default urgency level is user-configurable; initial default is "I am stressed". |
| 3 | Communication card dismissal | **Close button only.** Tapping the card body does nothing — prevents accidental dismissal while physically showing the device. |
| 4 | Settings backup/share | **Text code only** (no QR code in current implementation). Base64 blob; share sheet or clipboard copy. |
| 5 | Font pairings | **6 curated pairings, self-hosted as WOFF2.** All fonts committed to repo for full offline support. |
| 6 | Settings PIN | **No PIN.** Settings require deliberate navigation; no lock needed. |
| 7 | Default theme | **Bright Sunny** — warm, accessible, not gender-coded. |
| 8 | Urgency level count | **Configurable from 2 to 9.** |
| 9 | Default level selection | **"Make default" button in the edit dialog**, not a separate dropdown. Badge shown in the list. |
| 10 | "Something else" card placement | **Separate section below "+ Add need"** in the Needs editor. Not sortable; always visible. |
| 11 | Update mechanism | **Version file + SW messaging**, user-initiated reload via banner. No forced auto-reload. |

---

## 16. File Structure

```
somatic/
├── .github/workflows/
│   └── deploy.yml           # CI/CD: builds publish dir, injects version, deploys to S3
│
├── js/
│   ├── app.js               # Entry point
│   ├── screens/             # home.js, card.js, settings.js
│   ├── ui/                  # slider.js, grid.js, dialog.js
│   ├── data/                # config.js, themes.js, icons.js, icons-all.js
│   └── utils/               # theme.js, layout.js, contrast.js
│
├── vendor/fontawesome/      # FA Pro 5 self-hosted (CSS + WOFF2)
├── fonts/                   # Google Font pairings (WOFF2, committed to repo)
│
├── index.html               # App shell; three screen sections shown/hidden via CSS class
├── styles.css               # All styles; CSS custom properties for theming
├── sw.js                    # Service worker; cache-first; __VERSION__ placeholder
├── version.json             # {"v":"__VERSION__"} — never cached; used for update detection
├── manifest.json            # PWA manifest; start_url placeholder for deploy
└── icon.svg / icon-maskable.svg
```

---

## 17. Build & Deployment

### 17.1 Overview

Deployed to **AWS S3 + CloudFront**. No build step — the workflow copies source files, does string substitution (`sed`) to inject the git SHA as the version and base path, then syncs to S3 and invalidates CloudFront.

### 17.2 Branches → Environments

| Branch | Environment | URL |
|---|---|---|
| `release` | Production | `https://drewmayo.com/somatic/` |
| `staging` | Staging | `https://drewmayo.com/somatic-staging/` |

### 17.3 Deploy Steps

1. Copy all source files to a `publish/` directory
2. Inject `<base href>` into `index.html` for correct subpath resolution
3. Inject the git short SHA as `__VERSION__` into `sw.js`, `index.html`, and `version.json`
4. Inject the build date as `__BUILD_DATE__` into `index.html`
5. Sync static assets (fonts, vendor files) with a 1-year immutable cache header
6. Sync HTML, CSS, JS, `sw.js`, `manifest.json`, and `version.json` with a 5-minute cache header
7. Invalidate the CloudFront distribution for `/*` under the deployment path

### 17.4 Cache Strategy

| File type | Cache header | Reason |
|---|---|---|
| `index.html` | 5 minutes | Entry point; must reflect latest deploy quickly |
| `manifest.json` | 5 minutes | PWA installer checks this |
| `sw.js` | 5 minutes | Browser re-fetches on page load; stale sw.js blocks updates |
| `version.json` | 5 minutes | Must be current for update detection |
| JS / CSS | 5 minutes | No content hashing; must be re-fetched after deploys |
| Fonts / vendor / icons | 1 year, immutable | These files never change between deploys |

### 17.5 Required Secrets

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user with S3 write + CloudFront invalidation permissions |
| `AWS_SECRET_ACCESS_KEY` | Corresponding secret |
| `AWS_REGION` | AWS region |
| `AWS_S3_BUCKET_NAME` | Target S3 bucket |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Distribution serving the bucket |

---

## 18. Development Stages

Each stage produces a fully usable, testable slice of the app.

---

### Stage 1 — Minimal Working App ✓

A real person can pick an urgency level and a need, and show the card to someone else.

- Home screen: urgency slider, needs grid, Show Card button
- Communication card full-screen overlay
- Custom need dialog ("Something else…")
- 3-need selection cap with FIFO deselection
- Single hard-coded theme; in-memory state only (no persistence)

---

### Stage 2 — Settings: Urgency & Needs Editing ✓

The user or their carer can personalise labels, icons, and card order without touching code.

- Settings screen with Urgency, Needs, Theme, App, and Instructions tabs
- Urgency levels editor: edit label + icon, drag-to-reorder, add/remove, "Make default" in edit dialog
- Need cards editor: edit label + icon, show/hide toggle, drag-to-reorder, add/delete, "Something else" in separate section
- Inline icon mini-picker (17 icons + "…" for full picker) in all edit modals
- Full icon picker with search; whitespace-free grid layout
- localStorage persistence
- Theme gallery with 10 built-in themes; Bright Sunny as default
- Font size preference (default / large / extra-large)
- Full icon library toggle
- Backup & restore (base64 text code; share sheet or clipboard)
- Factory reset with confirmation

---

### Stage 3 — Deploy & PWA ✓

The app is installable and works fully offline; updates are detected automatically.

- `manifest.json` with icons, `start_url`, `display: standalone`
- Service worker with cache-first strategy and version-based cache invalidation
- `version.json` marker file for active update detection
- Update banner: "Somatic has been updated. [Reload]" — user-initiated, no forced reload
- Wake Lock API in card screen (keeps screen on while being shown)
- Haptic feedback on urgency slider (Vibration API, single pulse per tick)
- GitHub Actions deploy workflow (S3 + CloudFront, two environments)
- Playwright smoke tests for staging deploy

---

*End of design document.*
