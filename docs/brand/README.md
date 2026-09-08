# Kite Strength — app mark

An abstract breaking‑wave curl: one continuous ribbon that rolls from a
wind‑driven crest into a tight spiral, with a second thin "spray" line
tracing the wave face. Forward motion and stored energy, no hype.

## Palette

| Role        | Hex       |
|-------------|-----------|
| Blue        | `#2E9FDE` |
| White       | `#FFFFFF` |
| Ink (mono)  | `#0B1320` |

Two colours only. The mark survives as a single flat colour (see the mono
files) because the crest, body and spray are separated by real negative
space, not by colour.

## Files

| File                     | Use |
|--------------------------|-----|
| `icon-app.svg`           | Installable app icon — blue rounded square (112 px radius on 512), white wave, blue slit. ~12 % safe margin, stays legible when masked to a circle. Copy of `public/icon.svg`. |
| `mark.svg`               | Header / favicon mark — blue wave on transparent, slit as a true cut‑out (`fill-rule="evenodd"`). Works on `#FFFFFF`. |
| `mark-mono.svg`          | One‑colour variant. `fill="currentColor"` — set the colour on the `<img>`/parent or override the `fill`. |
| `icon-app-512.png`       | 512×512 PNG of the app icon masked to a circle (store / preview use). |
| `icon-app-512-square.png`| 512×512 PNG of the rounded‑square icon, transparent corners. |

Live wiring:

- `public/icon.svg` — the app icon (favicon + PWA manifest + dashboard header logo).
- `public/icon-mono.svg` — one‑colour version for any monochrome context.

## Regenerating the PNGs

The PNGs are rasterised from `icon-app.svg` at 512×512 (circle‑clipped for
`icon-app-512.png`). Any SVG→PNG renderer works; keep the output at 512 and
do not re‑compress the path data.
