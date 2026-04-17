# Somatic

A Progressive Web App for non-verbal communication for teenagers with autism.

See [DESIGN.md](./DESIGN.md) for the full design document.

## Status

All three stages complete.

**Stage 1 — Minimal working app** ✓
- Urgency slider, needs grid, Show Card button
- Full-screen communication card
- In-memory state only

**Stage 2 — Settings** ✓
- Urgency level and need card editors (label, icon, reorder, add/remove)
- Inline icon mini-picker + full searchable picker
- "Make default" in urgency edit dialog; "Something else" in separate section
- Theme gallery (10 built-in themes; default: Bright Sunny)
- Font size preference, full icon library toggle
- Backup & restore (base64 text code)
- localStorage persistence; factory reset

**Stage 3 — Deploy & PWA** ✓
- Service worker with cache-first strategy and version-based cache busting
- `version.json` for active update detection; "Somatic has been updated" banner
- Wake Lock API (screen stays on while card is shown)
- Haptic feedback on urgency slider
- GitHub Actions deploy to S3 + CloudFront (production + staging)
- Playwright smoke tests for staging

## Development

```sh
npm run dev    # serves on http://localhost:8080
```

No build step. Edit files and reload.
