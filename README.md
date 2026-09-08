# Awful Describer

Windows-first Electron desktop interface for describing images with local Ollama vision models.

## Current engineering status

The repository is undergoing a TypeScript/security hardening pass in `refactor/typescript-hardening` / PR #9. GitHub Issues #1–#10 are the canonical engineering backlog.

The current branch is TypeScript/TSX-first, with a shared typed IPC contract, strict compiler checks, Node unit tests, and Windows CI. Electron itself is still pinned to the legacy 28.x line and must not be treated as current until #7 is completed.

## Stack

- Electron
- React 18
- Zustand
- TypeScript (strict)
- Vite
- Tailwind CSS
- Ollama local HTTP/CLI integration
- `systeminformation` for host metrics

## Requirements

- Windows 11 is the primary supported development/runtime target.
- Node.js 22 is the CI baseline.
- npm with the committed lockfile.
- Ollama for real image-description runtime tests.

## Install

```powershell
npm ci
```

## Development

```powershell
npm run dev
```

Renderer only:

```powershell
npm run dev:renderer
```

Build main process and start Electron:

```powershell
npm run dev:main
```

## Verification

Run strict TypeScript checks and unit tests:

```powershell
npm run check
```

Run the production build:

```powershell
npm run build
```

Package without installer output:

```powershell
npm run pack
```

The GitHub Actions quality job runs `npm ci`, `npm run check`, and `npm run build` on `windows-latest`.

A green CI run proves compilation/unit/build health. It does not by itself prove native Electron dialogs, packaged runtime, drag-and-drop, Ollama installation, model inference, or GPU behavior. Those require Windows runtime smoke/E2E checks.

## Architecture

```text
src/
  shared/
    ipc.ts                  shared IPC/domain contract and runtime policy helpers
  main/
    main.ts                 Electron lifecycle orchestration
    window.ts               BrowserWindow + navigation/window policy
    preload.ts              narrow contextBridge API
    ipc/
      registerIpcHandlers.ts
      registerInstallerHandlers.ts
    services/
      ollamaService.ts      Ollama process/CLI/HTTP lifecycle
      fileService.ts        bounded image reads/search
      systemService.ts      CPU/memory/network information
      installerService.ts   HTTPS installer download
  renderer/
    App.tsx
    components/
    stores/appStore.ts      queue, generation and persisted UI state
    utils/presets.ts
```

`src/shared/ipc.ts` is the single source of truth for the renderer/preload/main contract. Privileged operations are implemented only in the main process and exposed through the narrow preload bridge.

See `docs/architecture.md` and `AGENTS.md` for boundaries and maintenance rules.

## Security model

- `nodeIntegration: false`
- `contextIsolation: true`
- sandbox-compatible renderer/preload boundary
- deny-by-default renderer navigation/new windows
- privileged IPC sender validation
- runtime validation for IPC input
- no renderer-controlled shell command strings
- HTTPS-only external URL policy by default
- app shutdown stops only an Ollama process started by this application
- active generation can be cancelled by request ID
- image reads are extension/size bounded
- installer execution is restricted to the file downloaded by the current application session

The dependency tree currently has unresolved security advisories tracked by #10. Do not interpret the application-level hardening above as a claim that the legacy dependency graph is clean.

## Electron upgrade warning

Do not directly bump Electron 28 to a current major without addressing drag-and-drop first. Electron 32 removed the non-standard `File.path` property used by the legacy drop flow. #7 tracks migration to `webUtils.getPathForFile` through preload and the controlled Electron upgrade.

## Agent workflow

Read `AGENTS.md`. Repository-local skills live in `.agents/skills/`:

- `electron-ipc-security`
- `ollama-runtime`
- `typescript-quality`

`docs/agent-context/` contains short navigation/context documents. GitHub Issues remain the canonical implementation backlog; Notion mirrors durable project/audit documentation.
