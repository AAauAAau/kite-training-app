# Kite Strength Tracker

Offline-first PWA für Krafttraining, Kitetage und regenerationsbasierte Planung.

## Lokal

```powershell
npm.cmd install
npm.cmd run dev
```

Tests und Production-Build:

```powershell
npm.cmd test
npm.cmd run build
```

## GitHub Pages

Das Vite-`base` ist auf `/kite-training-app/` gesetzt. Bei einem anderen Repository-Namen muss der Wert in `vite.config.ts` angepasst werden. Danach GitHub Pages unter **Settings → Pages → Source: GitHub Actions** aktivieren.

Die App speichert ausschließlich lokal in IndexedDB. Export/Import unter **Mehr** ist das Backup-Konzept.

## Produktplanung

- [Roadmap und Ideensammlung](docs/roadmap.md)
- [Feature-Specs](docs/features/README.md)

## Trainingsdokumentation

- [Board-Off-Progression (Trainingsentwurf)](docs/training/board-off-progression.md)
- [Recherchevorlage für Trick-Progressionen](docs/training/trick-progression-research-prompt.md)
