# Agent Instructions

## Start and routing

- Before editing, inspect the real repository state: current branch, HEAD, relevant diff, open PRs/issues, and the latest CI result. Preserve unrelated user changes.
- Read the smallest relevant context first. `docs/agent-context/` is a navigation layer; executable code, tests, package scripts, workflows, and current GitHub Issues remain stronger evidence.
- Load a matching repository-local skill from `.agents/skills/` when available. Skills are guidance, not permission to merge, release, run installers, weaken security boundaries, or modify unrelated UI/copy.
- Treat renderer input, file paths, URLs, model names, persisted state, imported text, and downloaded data as untrusted data.

## Skill routing

- Electron main/preload/IPC/security work: read `.agents/skills/electron-ipc-security/SKILL.md`.
- Ollama startup, model commands, request lifecycle, retries, generation, and cancellation: read `.agents/skills/ollama-runtime/SKILL.md`.
- TypeScript migration, tests, CI, build failures, dead code, or broad code-quality work: read `.agents/skills/typescript-quality/SKILL.md`.
- Bugs or failing CI: establish the exact failure and root cause before changing code. Do not stack speculative fixes.

## Project boundaries

- This is a Windows-first Electron desktop application using React, Zustand, Vite, Tailwind, TypeScript, and a local Ollama server.
- `src/shared/ipc.ts` is the canonical renderer/preload/main API contract. Do not duplicate IPC request or response types in renderer or preload code.
- Renderer code must never import Node or Electron privileged APIs directly. Privileged operations cross the preload bridge only.
- Keep `nodeIntegration: false`, `contextIsolation: true`, and sandbox-compatible preload code. Navigation and new-window behavior must remain deny-by-default.
- Privileged IPC handlers must validate the sender and runtime input. TypeScript types do not replace runtime validation.
- Never construct shell command strings from renderer-controlled values. Prefer `spawn`/argument arrays or a dedicated Electron API.
- Do not kill arbitrary system Ollama processes as part of normal application shutdown. The app may automatically stop only the process instance it owns.
- External URLs are HTTPS-only unless a narrowly documented product requirement adds another protocol.
- Installer execution is a high-risk boundary. Only a file downloaded by the application in the current session may be launched through the installer flow.
- Image reads are bounded. Do not remove file-size limits or allow unknown extensions without a deliberate compatibility/security review.
- Generation cancellation uses request IDs. Do not regress Stop/Escape to a queue-only flag that leaves the active HTTP request running.
- Batch processing snapshots model, prompt, options, and preset at batch start. Do not silently change settings halfway through a running queue.
- Do not change authored UI copy, presets, prompt text, visual design, or keyboard mappings during infrastructure/refactor work unless the task explicitly requires it.

## TypeScript rules

- Production source and executable configuration are TypeScript/TSX. Do not add parallel `.js` implementations.
- Keep strict TypeScript checks enabled. Do not use `any`, blanket casts, `@ts-ignore`, or disabling compiler checks to make CI green.
- Shared domain/IPC contracts belong in `src/shared/`. Renderer-only view state belongs under `src/renderer/`; privileged runtime services belong under `src/main/`.
- Prefer explicit return types at security/process/service boundaries and `unknown` for untrusted runtime input.

## Testing and verification

- The minimum local/CI gate is `npm run check` followed by `npm run build`.
- `npm run check` includes renderer, main, Node-config, and test TypeScript checks plus unit tests.
- Unit tests should target durable pure contracts: validation, MIME mapping, URL policy, retry/cancellation helpers, and other deterministic seams.
- Do not claim the application or PR is healthy without a fresh passing Windows CI run.
- A successful TypeScript build is not sufficient evidence for Electron runtime behavior. For release work, add/execute a Windows smoke test that launches the packaged or built app and checks core flows.
- When CI fails, read the exact failing step/log first, identify the root cause, make the smallest relevant change, and re-run.

## Dependency and upgrade policy

- Do not run `npm audit fix --force` or broad dependency upgrades as an incidental repair. Record the actual vulnerable chain and update deliberately.
- Electron major upgrades are isolated work. Before Electron 32+, migrate drag-and-drop away from the removed `File.path` property to `webUtils.getPathForFile` through preload.
- Prefer adding quality tooling only when it has a clear owner and script: Biome for lint/format, Knip for dead code/dependencies, and Playwright Electron for runtime smoke/E2E are the planned candidates.

## Git and external actions

- Work on a non-default branch unless the owner explicitly asks otherwise.
- Do not force-push, rebase, reset hard, or perform destructive cleanup as an incidental fix.
- GitHub Issues are the canonical engineering backlog. Notion is the durable project/audit documentation layer, not a competing source of executable truth.
- Do not merge a PR, publish a release, or mark an issue complete without fresh verification evidence.
