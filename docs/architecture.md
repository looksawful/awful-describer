# Architecture

## Purpose

Awful Describer is a local-first Electron application that sends user-selected images and prompts to a local Ollama vision model. The architecture must preserve a strict privilege boundary between the React renderer and operating-system capabilities.

## Process boundaries

### Renderer

`src/renderer/` owns presentation, queue state, prompts/options, history, panels, and user actions. It has no direct Node.js filesystem/process access.

The renderer calls only `window.api`, whose TypeScript shape comes from `ApiBridge` in `src/shared/ipc.ts`.

### Preload

`src/main/preload.ts` is intentionally thin. It maps explicit `window.api` methods to `ipcRenderer.invoke` and maps progress events to callback subscriptions.

It must not expose raw `ipcRenderer`, filesystem APIs, child-process APIs, or broad generic invoke/send methods.

### Main process

`src/main/main.ts` is lifecycle orchestration only. It creates the main window, registers IPC handlers, owns the Ollama service instance, and applies application lifecycle behavior.

`src/main/window.ts` owns BrowserWindow construction and navigation/new-window policy.

`src/main/ipc/` validates renderer identity and runtime inputs before dispatching to services.

### Services

- `OllamaService`: executable discovery, app-owned server process, model CLI operations, generation HTTP requests, cancellation.
- `fileService`: image MIME/size validation, base64 reads, bounded recursive image search.
- `systemService`: CPU/memory and Ollama port information through `systeminformation`.
- `installerService`: HTTPS-only installer download with redirect and timeout limits.

Services do not own renderer UI state.

## Shared contract

`src/shared/ipc.ts` is the source of truth for cross-process types and pure boundary policies.

This file contains:

- Ollama request/response/domain types
- `ApiBridge`
- generation input sanitization
- model-option sanitization
- image MIME mapping
- trusted renderer URL policy
- safe external URL policy

Renderer declarations must import this contract rather than redefining it.

## Generation lifecycle

1. Renderer snapshots current model, prompt, options, and preset.
2. Renderer reads the image through bounded file IPC.
3. Renderer creates a unique `requestId`.
4. Main validates the generation payload.
5. `OllamaService` stores the active HTTP request by request ID and sends a non-streaming `/api/generate` request.
6. Stop/Escape calls `ollama:cancel(requestId)` and destroys that actual HTTP request.
7. Completed results update queue/history. A user cancellation restores the image to pending rather than marking it as a model failure.

Batch processing snapshots settings once before the batch starts. Editing the controls during a batch must not silently mutate later items in the same run.

## Ollama process ownership

An already-running Ollama server is treated as external. Awful Describer may use it but does not own it.

When Awful Describer starts `ollama serve`, the returned child process is tracked as app-owned. Automatic shutdown may terminate only that child. The application must not use global `taskkill`, `pkill`, or equivalent behavior during normal shutdown.

## Security boundaries

### IPC

All privileged handlers validate the renderer sender and untrusted input at runtime. Compile-time TypeScript types are not considered runtime validation.

### Commands

Renderer-controlled strings never enter an interpolated shell command. CLI work uses command plus argument arrays with shell disabled.

### URLs

Unexpected in-app navigation and child windows are denied. External opening is HTTPS-only by default.

### Installer

The downloader accepts HTTPS and a bounded redirect chain. The launch handler accepts only the exact installer path produced by the current app session.

### Files

Image reading is extension-aware and bounded to 50 MiB. Unknown image extensions and oversized files fail closed.

## State architecture

Zustand currently owns both UI state and processing orchestration. This is acceptable for the present application size, but the processing actions are the highest-coupling renderer area. If batch modes, concurrency, streaming, retries, or multi-request workflows expand, move processing orchestration into a dedicated typed controller/service rather than growing `appStore.ts` indefinitely.

Persisted state currently includes model/prompt/options/presets/panels/history and two legacy settings. Persistence versioning/migrations and dead setting cleanup are tracked in #6.

## Known architectural debt

- Electron 28 is obsolete and blocks modern security/runtime assumptions. #7.
- Drag-and-drop still relies on the pre-Electron-32 `File.path` behavior. #7.
- No Electron runtime smoke/E2E suite yet. Planned Playwright Electron coverage.
- No repository-wide lint/format/dead-code tool yet. Planned Biome/Knip evaluation after baseline stability.
- Dependency advisories remain unresolved. #10.
- `appStore.ts` remains larger than ideal and should not absorb additional process/network concerns.

## Verification layers

1. Strict TypeScript: renderer, main/shared, Node config, tests.
2. Pure unit tests: cross-process policy/validation contracts.
3. Production bundle build.
4. Windows Electron smoke/E2E: still to be implemented.
5. Real local Ollama inference/GPU smoke test: required for release confidence where Ollama behavior changes.

A lower layer cannot be described as evidence for a higher layer.
