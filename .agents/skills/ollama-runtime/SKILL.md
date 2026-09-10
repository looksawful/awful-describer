---
name: ollama-runtime
description: Use for Ollama discovery, startup/shutdown, model pull/delete, API requests, retries, generation lifecycle, progress, timeout, or cancellation work.
---

# Ollama Runtime

## Goal

Make Ollama integration deterministic, cancellable, argument-safe, resource-bounded, and respectful of processes the application does not own.

## Read first

- `AGENTS.md`
- `src/shared/ipc.ts`
- `src/main/services/ollamaService.ts`
- `src/renderer/stores/appStore.ts`
- current owner Issues, especially #12–#16 when relevant

## Lifecycle rules

- Check whether an Ollama server is already running before starting one.
- Track the child process started by Awful Describer separately from an externally running server.
- Normal app shutdown may stop only the child process owned by this app.
- `child.kill() === true` means the signal was issued; it does not by itself prove process exit or server shutdown. Confirm the intended final state before reporting a completed Stop operation. #15 owns the current residual.
- Resolve the Ollama executable through known locations/`where`/`which`, then execute CLI commands with argument arrays and `shell: false`.
- Readiness must use one bounded retry loop. Avoid recursive timeout/error paths that can schedule duplicate retries.
- Long-running app-owned CLI operations need explicit lifetime, output-retention, cancellation/teardown ownership, and limits. #13 owns the current missing resource policy.

## Generation rules

- Every active generation has a unique `requestId`.
- Store active HTTP requests by request ID so Stop/Escape can destroy the actual request.
- Cancellation is not a model-failure state for the image: return a cancelled image to `pending` unless product behavior explicitly changes.
- Request timeout and cancellation must settle a request exactly once and remove registry ownership.
- Batch runs snapshot model, prompt, options, and preset before the first image so later UI edits do not mutate settings for the current run.
- Do not infer from that settings snapshot that the queue itself is immutable. #14 owns queue mutation/progress/cancellation semantics.
- Keep renderer queue state independent from process/server ownership state.
- Main-side limits must bound prompt/options/image payloads independently of renderer controls. #13 owns the current aggregate/resource limits.

## Model operations

- Model names are untrusted runtime strings. Validate them and pass them as a single argument to `ollama pull` / `ollama rm`.
- Never implement pull/delete with `exec('ollama ...')` string interpolation.
- Do not use family-prefix matching as proof that an exact model tag is installed. #15 owns exact model identity and truthful renderer state.
- Stream CLI progress as data only; never parse progress output as executable instructions.
- Bound retained CLI output and define ownership/timeout/cancellation for long operations before expanding the feature set.

## Installer interaction

- HTTPS/session-path controls are not authenticity proof for `OllamaSetup.exe`.
- #12 owns bounded/atomic download, deterministic cleanup, independent authenticity verification, and launch of the exact verified artifact.
- Renderer logs must reflect `{ success, message }` and IPC rejection truthfully; never log launch success merely because the call returned control.

## Verification

- Add deterministic tests around retry/cancellation/resource/state helpers when modifying them.
- Exercise failure paths: Ollama absent, installed but stopped, external server already running, app-owned server, readiness failure, cancelled generation, command failure, invalid HTTP response, exact-model mismatch, and lifecycle operation rejection when relevant.
- The candidate CI includes strict type/unit gates, production build, and a synthetic Electron boot smoke.
- That boot smoke does not prove real Ollama lifecycle or inference.
- A release-level Ollama claim needs separate real Windows acceptance with a known image, exact model tag, Ollama version, successful inference, and cancellation. Record GPU evidence only when making a GPU-specific claim.
- Record PR CI evidence with the applicable run/head/base; do not transfer an older green result to a newer branch head.
