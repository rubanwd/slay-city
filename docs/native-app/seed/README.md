# Seed

Code that ships into `slay-city-native` alongside the documents in the parent
folder.

| Path | Purpose | Work package |
| --- | --- | --- |
| `scripts/check-upstream-drift.mjs` | Detects drift between this repository's tracked copies of shared logic and upstream `rubanwd/slay-city`. Exit 0 in sync, 1 on drift, 2 on a manifest or path error. | `WP-0.5` |

Usage and the manifest format are in [../SYNC.md](../SYNC.md).
