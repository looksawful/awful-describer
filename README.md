# Awful Describer

Windows-first Electron desktop interface for describing images with local Ollama vision models.

## Current engineering status

The default branch is still `master`. The next-baseline candidate is `refactor/typescript-hardening` in draft PR #9.

PR #9 contains the completed baseline work from Issues #1–#5 and #8: TypeScript hardening, a shared typed IPC contract, stricter Electron boundaries, deterministic Ollama request cancellation, renderer correctness fixes, repository guidance, tests, and Windows CI. Residual work is tracked by #6, #7, and #10–#18; #18 is the cross-cutting completion gate.

The candidate branch is TypeScript/TSX-first and still pins Electron 28.x. Treat it as a hardened candidate, not as a current supported-runtime release baseline, until the dependency, capability, runtime-upgrade, and verification work is complete.

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
- Ollama for real image-description runtime acceptance tests.

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

Build the main process and start Electron:

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

Run the existing Electron boot smoke after building:

```powershell
npm run smoke:electron:run
```

Package without installer output:

```powershell
npm run pack
```

The Windows GitHub Actions job currently runs, in order:

1. `npm ci`
2. `npm run check`
3. `npm run build`
4. `npm run smoke:electron:run`

The existing Electron smoke is deliberately narrow. It loads the built renderer and preload in a test-created `BrowserWindow` with mocked handlers, then checks React mount and selected bridge functions. A green run therefore proves the current type/unit/build gates plus this renderer/preload boot path. It does **not** prove the real application bootstrap, real handler registration, filesystem grants, packaged Windows behavior, native dialogs, Ollama installation, model inference, or GPU use. #16 owns those higher verification layers.

For PR CI, refer to the GitHub Actions run associated with the current PR head and base. Do not describe a pull-request run as proof that an arbitrary standalone SHA is healthy outside that PR context.

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

Implemented in the candidate branch:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`
- deny-by-default renderer navigation and new windows
- deny-all Electron permission handlers unless a future capability is explicitly designed
- privileged IPC sender validation
- runtime validation for IPC input
- no renderer-controlled shell command strings for model operations
- HTTPS-only external URL policy by default
- app shutdown stops only an Ollama process started by this application
- active generation can be cancelled by request ID
- image reads are extension/size bounded
- installer launch is restricted to the path downloaded by the current application session

These controls are not the final security boundary. Path strings from the trusted renderer are not yet explicit user-grant capabilities (#11), cross-process/resource budgets remain incomplete (#13), installer authenticity is not yet independently verified (#12), and the dependency graph has unresolved advisories (#10).

## Electron upgrade warning

Do not directly bump Electron 28 to a newer major while preserving the legacy renderer `File.path` flow. #11 defines the filesystem grant model; #7 owns the supported drag/drop path migration and controlled Electron/electron-builder upgrade. Do not replace `File.path` with casts or a broad preload escape hatch.

## Agent workflow

Read `AGENTS.md`. Repository-local skills live in `.agents/skills/`:

- `electron-ipc-security`
- `ollama-runtime`
- `typescript-quality`

`docs/agent-context/` contains short navigation/context documents. GitHub Issues remain the canonical implementation backlog; Notion stores durable project/audit context rather than a competing executable task list.
