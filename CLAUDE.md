# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A terminal/CLI-themed personal portfolio site built as a hiring artifact for a DevOps role. The site itself (a faux shell in the browser) is the showcase; the *way* it's built and deployed (static Astro → multi-stage container → k3s + ArgoCD on Oracle Cloud Always Free) is the DevOps signal. Content authoring is markdown — no code change needed to add a project.

## Commands

```bash
npm run dev      # Astro dev server, default localhost:4321
npm run build    # static build → ./dist
npm run preview  # serve the built ./dist
npm run check    # astro check — TypeScript + .astro diagnostics (use as the lint/typecheck gate)
```

There is **no test suite**. Verification is manual: run `npm run dev`, exercise commands in the terminal (`help`, `ls`, `cd projects`, `cat about.md`, `theme dracula`, `tree`, ↑/↓ for history, Tab for completion). For a production-equivalent check, build the container:

```bash
docker build -t ali-website .
docker run --rm -p 8080:80 ali-website   # then open http://localhost:8080
```

## Architecture

### Build-time virtual filesystem (the central trick)

There is no real filesystem in the browser. `src/lib/filesystem.ts` uses Vite's `import.meta.glob('/src/portfolio/**/*.md', { eager: true, query: '?raw', import: 'default' })` to inline every markdown file's raw text into the JS bundle at build time, then builds an in-memory tree of `DirNode | FileNode` keyed by path. All path commands (`ls`, `cd`, `cat`, `tree`, `open`) walk this tree; nothing fetches anything at runtime.

**Implication:** adding a project = drop a new `.md` into `src/portfolio/projects/` and rebuild. No code change, no router, no registration. The content directory is deliberately `src/portfolio/` (not `src/content/`) to avoid Astro 5's content-collection auto-detection.

### Command system

Each terminal command is a single file under `src/lib/commands/<name>.ts` exporting a `Command` (`{ name, description, usage?, run(ctx) }`). `src/lib/commands/index.ts` aggregates them into `commandList` and exposes `buildRegistry()`. `PATH_COMMANDS = new Set([...])` declares which commands accept a path argument — used by `Terminal.client.ts` for tab-completion routing.

`CommandContext` (in `commands/types.ts`) is the only API a command sees: `cwd`, `setCwd`, `print`, `clear`, `args`, `raw`, `registry`, `setTheme`, `buildCommitSha`. Commands must never reach into the DOM directly — go through `print`. A command that takes a path arg should also be added to `PATH_COMMANDS` so tab-completion works.

### Shell loop

`src/components/Terminal.client.ts` is the only client-side entry point. It owns `cwd`, command history (persisted in `localStorage` under `terminal-history`, capped at 200), ↑/↓ history navigation with stash for in-progress input, Tab completion (first-token → commands, path arg → FS lookup via `resolvePath`+`getNode`+`listDirEntries`), Ctrl-L clear, Ctrl-C abandon-line. The Astro page mounts it onto `#terminal-root`.

### SEO / no-JS fallback

`src/components/Terminal.astro` includes a `<noscript>` block that walks the virtual FS at SSR/build time and emits every markdown file inline as `<pre>` blocks with proper headings. Crawlers and JS-disabled visitors get a usable project list with links. **Do not break this** — anything that goes into the virtual FS must remain readable without JS.

### Theming

`src/lib/themes.ts` defines themes as CSS-variable maps and `applyTheme(name)` sets them on `document.documentElement`. Persisted in `localStorage` under `terminal-theme`. To prevent FOUC, `src/pages/index.astro` has an inline `<script is:inline>` that reads the saved theme and writes the CSS vars **before** the main bundle loads.

### Container / production serve

Multi-stage `Dockerfile`: `node:20-alpine` build → `nginx:alpine` serve. The build accepts `--build-arg COMMIT_SHA=<sha>` which becomes `PUBLIC_COMMIT_SHA` (read by `version` command via `import.meta.env`). `nginx.conf` caches `/_astro/` hashed assets for a year and forbids caching `.html`, so deploys land instantly.

**ARM caveat:** production target is Oracle Cloud Ampere A1 (aarch64). When pushing to a registry for the cluster, use `docker buildx build --platform linux/amd64,linux/arm64` — the local single-arch build is fine for local dev only.

## Environment specifics

- WSL on Windows, working tree lives on a OneDrive-synced path. `astro.config.mjs` sets `vite.server.watch.usePolling: true` because native fs events are unreliable on this mount — don't remove it.
- TypeScript is strict (`tsconfig.json` extends `astro/tsconfigs/strict`). When indexing into recursive structures (e.g. walking `DirNode.children`), give the result an explicit type annotation — TS7022 has bitten `filesystem.ts` before.

## What's planned but not yet built

A full plan lives at `/home/ali/.claude/plans/kind-launching-mccarthy.md`. Short version: Phases 1 (Astro+terminal) and 2 (container) are done. Phase 3 (k3s on Oracle Cloud Ampere A1, fallback Hetzner CX22), Phase 4 (GitOps via ArgoCD, separate `personal-website-infra` repo for manifests), Phase 5 (GitHub Actions → ghcr.io → bump tag in infra repo), and Phase 6 (real content + polish) are pending.
