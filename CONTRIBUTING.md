# Contributing to Redix

Thank you for taking the time to contribute! Please read through this guide before opening an issue or PR.

## Code of Conduct

Be respectful. Harassment or abusive behaviour of any kind will not be tolerated.

## Reporting bugs

Before filing a new issue, search [existing issues](https://github.com/diwanshuMidha/redix/issues) to avoid duplicates. Use the **Bug Report** template and include:

- Redix version and OS
- Steps to reproduce
- Expected vs actual behaviour
- Relevant logs from the DevTools console or Electron main process

## Requesting features

Open a **Feature Request** issue. Describe the problem you're solving and why it belongs in Redix rather than an external tool.

## Development setup

**Prerequisites:** Node.js ≥ 20, pnpm ≥ 9

```bash
git clone https://github.com/diwanshuMidha/redix.git
cd redix
pnpm install
pnpm dev
```

`pnpm dev` starts Electron with Vite hot-reload. The main process restarts automatically when you edit files under `src/main/` or `src/preload/`; the renderer hot-reloads for changes under `src/renderer/`.

## Making changes

1. Fork the repo and create a branch from `master`: `git checkout -b fix/my-bug`
2. Make your changes. Run `pnpm typecheck` to catch type errors before committing.
3. Keep commits focused and write a clear commit message.
4. Open a pull request against `master`. Fill in the PR template.

## Pull request guidelines

- One logical change per PR — easier to review and revert if needed.
- Include a short description of *why* the change is needed, not just what it does.
- If your PR closes an issue, add `Closes #<number>` in the description.
- Screenshots are appreciated for UI changes.

## Project structure

```
src/
  main/       # Electron main process — IPC handlers, SQLite, Redis client
  preload/    # Context bridge
  renderer/   # React UI
  shared/     # Types and IPC channel constants
```

Key conventions:

- IPC channels are defined as constants in `src/shared/ipc-channels.ts` — add new channels there.
- All IPC handlers live under `src/main/ipc/` and are registered in `src/main/ipc/index.ts`.
- Renderer side calls go through the typed wrapper in `src/renderer/src/lib/ipc.ts`.
- Tailwind CSS v4 is used — use CSS custom properties from `globals.css` for theme colours.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) loosely:

```
feat: add TTL inline editing in key browser
fix: prevent crash when Redis disconnects mid-scan
chore: upgrade electron to 36
```

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE).
