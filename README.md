# Somatic

A Progressive Web App for non-verbal communication for teenagers with autism.

## Status

**Design proposal complete — awaiting review.**

See [DESIGN.md](./DESIGN.md) for the full design proposal.

## Development Stages

**Stage 1 — Minimal working app** ✓ complete — awaiting review
- Hard-coded theme, urgency levels, and need cards
- Home screen: slider + grid + Show Card button
- Full-screen communication card + custom need dialog
- In-memory state only (no persistence)

**Stage 2 — Settings: urgency & needs editing**
- Settings screen with urgency level and need card editors
- Icon picker, drag-to-reorder (SortableJS)
- localStorage persistence
- UI prefs (reduce motion, font size)

**Stage 3 — Themes**
- All 10 built-in themes + theme gallery
- Theme editor and import/export (base64 + QR code)
- All 6 font pairings self-hosted

**Stage 4 — Deploy & PWA**
- manifest.json, service worker, PWA icons
- GitHub Actions deploy workflow (S3 + CloudFront)
- Install banner, Wake Lock, haptic feedback
