# Architecture

## Purpose

Awful Describer is a local-first Electron application that sends user-selected images and prompts to a local Ollama vision model. The architecture must preserve a strict privilege boundary between the React renderer and operating-system capabilities.

This document describes the candidate architecture in `refactor/typescript-hardening` / PR #9 until that work becomes the default-branch baseline.

## Process boundaries

### Renderer

`src/renderer/` owns presentation, queue state, prompts/options, history, panels, and user actions. It has no direct Node.js filesystem/process access.

The renderer calls only `window.api`, whose TypeScript shape comes from `ApiBridge` in `src/shared/ipc.ts`.

### Preload

`src/main/preload.ts` is intentionally thin. It maps explicit `window.api` methods to `ipcRenderer.invoke` and maps progress events to callback subscriptions.

It must not expose raw `ipcRenderer`, filesystem APIs, child-process APIs, or broad generic invoke/send methods.

### Main process

`src/main/main.ts` is lifecycle orchestration. It creates the main window, registers IPC handlers, owns the Ollama service instance, and applies application lifecycle behavior.

`src/main/window.ts` owns `BrowserWindow` construction and navigation/new-window policy.

`src/main/ipc/` validates renderer identity and runtime inputs before dispatching to services.

### Services

- `OllamaService`: executable discovery, app-owned server process, model CLI operations, generation HTTP requests, and request cancellation.
- `fileService`: image MIME/size validation, base64 reads, and bounded recursive image search.
- `systemService`: CPU/memory and Ollama port information through `systeminformation`.
- `installerService`: HTTPS-only installer download with redirect and timeout limits.

Services do not own renderer UI state.

## Shared contract

`src/shared/ipc.ts` is the source of truth for cross-process types and pure boundary policies.

It contains:

- Ollama request/response/domain types;
- `ApiBridge`;
- generation input sanitization;
- model-option sanitization;
- image MIME mapping;
- trusted-renderer URL policy;
- safe external-URL policy.

Renderer declarations must import this contract rather than redefine it.

## Generation lifecycle

1. The renderer snapshots the current model, prompt, options, and preset.
2. The renderer reads the image through bounded file IPC.
3. The renderer creates a `requestId`.
4. Main validates the generation payload.
5. `OllamaService` stores the active HTTP request by request ID and sends a non-streaming `/api/generate` request.
6. Stop/Escape calls `ollama:cancel(requestId)` and destroys that active HTTP request.
7. Completed results update queue/history. User cancellation restores the image to pending rather than marking it as a model failure.

Batch processing snapshots model/prompt/options/preset at the start of the run. The queue itself is not yet an immutable operation snapshot: live destructive mutations can diverge from the captured work list. #14 owns that state-model correction.

## Ollama process ownership

An already-running Ollama server is treated as external. Awful Describer may use it but does not own it.

When Awful Describer starts `ollama serve`, the returned child process is tracked as app-owned. Automatic shutdown may terminate only that child. Normal shutdown must not use global `taskkill`, `pkill`, or equivalent process-wide behavior.

Generation requests are tracked independently by request ID. `stopOwned()` currently reports whether a kill signal was issued to the owned child; it does not yet prove that the process exited and the server became unavailable. #15 owns truthful lifecycle completion semantics.

## Security boundaries

### BrowserWindow

The candidate window policy explicitly sets:

- `nodeIntegration: false`;
- `contextIsolation: true`;
- `sandbox: true`;
- `webSecurity: true`.

Unexpected navigation and child windows are denied. Electron permission checks/requests are denied unless a future capability is deliberately introduced. Webview attachment is blocked.

### IPC

Privileged handlers validate the renderer sender and untrusted input at runtime. Compile-time TypeScript types are not runtime validation.

Sender validation proves that a request came from the trusted renderer context. It does **not** turn a renderer-provided path into an explicit user filesystem grant. #11 owns that authorization layer.

### Commands

Renderer-controlled model values do not enter interpolated shell command strings. Ollama CLI work uses executable plus argument arrays with `shell: false`.

### URLs

Unexpected in-app navigation and child windows are denied. External opening is HTTPS-only by default.

### Installer

The downloader accepts HTTPS, limits redirect depth, and has a request timeout. The launch handler accepts only the exact installer path produced by the current app session.

That path/session check establishes provenance inside the current application flow; it is **not** authenticity verification. The download still needs byte limits, atomic partial-file handling, deterministic cleanup, and independent publisher/digest verification before launch. #12 owns that work.

### Files

Image reads currently reject unsupported extensions and files larger than 50 MiB. These checks limit format/size exposure but do **not** authorize the path itself. Explicit main-owned file/directory grants are tracked in #11. End-to-end payload and race-safe resource limits are tracked in #13.

## State architecture

Zustand currently owns both UI state and processing orchestration. That keeps the current implementation compact, but it also concentrates queue mutation, cancellation, persistence, and generation state in `appStore.ts`.

Known state work is explicit rather than speculative:

- #6: versioned/validated persistence, retention budgets, and dead-contract cleanup;
- #14: deterministic queue/operation state under live mutations;
- #15: authoritative Ollama/model operation state.

If concurrency, streaming, retries, or multi-request workflows expand, processing orchestration should move behind a dedicated typed controller/service instead of adding more coupled flags to the store.

## Known architectural debt

- #10: unresolved vulnerable/deprecated dependency chains require fresh classification and remediation.
- #11: renderer path strings are not yet main-owned user grants.
- #12: installer download is not yet bounded/atomic/authenticity-verified.
- #13: cross-process payload and long-running CLI/file resource budgets are incomplete.
- #6: persisted state has no explicit version/migration/validation strategy and retains legacy surface.
- #14: queue and active-operation mutation semantics are not yet deterministic.
- #15: Ollama/model lifecycle feedback and model-tag identity can be optimistic or imprecise.
- #7: Electron 28 and legacy renderer `File.path` remain until the controlled runtime migration.
- #16: higher runtime-verification layers are still missing.
- #17: low-risk renderer/offline/shortcut/format inconsistencies remain.

## Verification layers

Each layer has a narrower claim than the layer above it:

1. **Static/type:** strict TypeScript projects.
2. **Deterministic unit:** pure validation, MIME, URL/sender-policy, retry/cancellation, and other controller/policy seams.
3. **Production build:** renderer and main build successfully.
4. **Existing Electron boot smoke:** a test-created `BrowserWindow` with mocked handlers loads the built renderer/preload and checks React mount plus selected bridge functions.
5. **Main-process integration and real application smoke:** planned under #16; exercises actual handler/service policy and the real application bootstrap.
6. **Packaged Windows smoke:** planned under #16/#7; exercises packaged paths and launch behavior.
7. **Real Ollama vision acceptance:** separate controlled runtime evidence for actual model inference/cancellation, with model/Ollama version recorded.

The current Windows CI runs layers 1–4. Layer 4 is useful regression evidence, but it is not proof of layers 5–7. A lower layer must never be described as evidence for a higher one.
