# Redix

A modern Redis GUI desktop client built with Electron, React, and TypeScript.

![License](https://img.shields.io/github/license/diwanshuMidha/redix)
![Version](https://img.shields.io/github/package-json/v/diwanshuMidha/redix)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-blue)

## Features

- **Key Browser** — browse, search, and edit all Redis key types (String, Hash, List, Set, ZSet)
- **CLI** — run Redis commands directly from the app with a terminal-style interface
- **Server Stats** — live memory, ops/sec, keyspace hit rate, and uptime metrics (auto-refreshes every 5 s)
- **TLS / ACL** — secure connections with TLS and Redis ACL user authentication
- **Multiple connections** — manage and switch between multiple Redis instances; connections are persisted locally via SQLite
- **Command Palette** — keyboard-driven navigation with `Cmd/Ctrl+K`
- **Prefix tree** — hierarchical key browser organized by `:` delimiters

## Screenshots

> Add screenshots here once the UI is stable.

## Installation

### Download a release

Grab the latest installer for your platform from the [Releases](https://github.com/diwanshuMidha/redix/releases) page:

| Platform | File |
|----------|------|
| Linux    | `.deb` / `.AppImage` |
| macOS    | `.dmg` |
| Windows  | `.exe` (NSIS installer) |

### Build from source

**Prerequisites:** Node.js ≥ 20, pnpm ≥ 9

```bash
git clone https://github.com/diwanshuMidha/redix.git
cd redix
pnpm install
pnpm dev          # start in dev mode
pnpm package      # build a distributable for your current OS
```

Platform-specific builds:

```bash
pnpm package:win  # Windows NSIS installer (cross-compile via Wine or run on Windows)
```

Artifacts land in `dist/`.

## Development

```bash
pnpm dev          # Electron + Vite hot-reload
pnpm typecheck    # run TypeScript checks (main + renderer)
pnpm build        # production build (no installer)
```

### Project layout

```
src/
  main/           # Electron main process
    db/           # SQLite connection storage (better-sqlite3)
    ipc/          # IPC handlers (connections, keys, values, server)
    redis/        # ioredis client manager
  preload/        # Context bridge
  renderer/       # React UI
    components/   # Layout, modals, Redis viewers, UI primitives
    pages/        # Connection, Welcome, CLI, ServerInfo
    store/        # Zustand stores
    hooks/        # React Query hooks
  shared/         # Types and IPC channel constants shared across processes
```

### Tech stack

| Layer | Library |
|-------|---------|
| Shell | Electron 35 |
| Bundler | electron-vite + Vite 6 |
| UI | React 19 + TailwindCSS 4 |
| State | Zustand 5 |
| Data fetching | TanStack React Query 5 |
| Redis client | ioredis 5 |
| Local storage | better-sqlite3 12 |
| Routing | React Router 7 |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) © Diwanshu Midha
