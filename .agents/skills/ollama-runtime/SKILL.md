---
name: ollama-runtime
description: Use for Ollama discovery, startup/shutdown, model pull/delete, API requests, retries, generation lifecycle, progress, timeout, or cancellation work.
---

# Ollama Runtime

## Goal

Make Ollama integration deterministic, cancellable, argument-safe, and respectful of Ollama processes the application does not own.

## Read first

- `AGENTS.md`
- `src/shared/ipc.ts`
- `src/main/services/ollamaService.ts`
- `src/renderer/stores/appStore.ts`

## Lifecycle rules

- Check whether an Ollama server is already running before starting one.
- Track the child process started by Awful Describer separately from an externally running server.
- Normal app shutdown may stop only the child process owned by this app.
- Resolve the Ollama executable once through known locations/`where`/`which`, then execute CLI commands with argument arrays and `shell: false`.
- Readiness must use one bounded retry loop. Avoid recursive timeout/error paths that can schedule duplicate retries.

## Generation rules

- Every active generation has a unique `requestId`.
- Store active HTTP requests by request ID so Stop/Escape can destroy the actual request.
- Cancellation is not an error state for the image: return a cancelled image to `pending` unless product behavior explicitly changes.
- Request timeout and cancellation must settle a request exactly once.
- Batch runs snapshot model, prompt, options, and preset before the first image so user edits do not mutate half of a batch.
- Keep renderer queue state independent from process/server ownership state.

## Model operations

- Model names are untrusted runtime strings. Validate them and pass them as a single argument to `ollama pull` / `ollama rm`.
- Never implement pull/delete with `exec('ollama ...')` string interpolation.
- Stream CLI progress as data only; never parse progress output as executable instructions.

## Verification

- Add deterministic tests around retry/cancellation helpers when modifying them.
- Test the failure path: Ollama absent, Ollama installed but stopped, external server already running, app-owned server, cancelled generation, command failure, invalid HTTP response.
- Run `npm run check` and `npm run build`; verify Windows CI.
- A release-level change also needs a real local Ollama smoke test on Windows rather than only mocked/pure unit tests.
