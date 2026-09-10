# Agent Instructions

## Start and routing

- Before editing, inspect the real repository state: default branch, working branch, HEAD, relevant diff, open PRs/issues, and the latest applicable CI result. Preserve unrelated user changes.
- Read the smallest relevant context first. `docs/agent-context/` is a navigation layer; executable code, tests, package scripts, workflows, current GitHub Issues, and current PR state are stronger evidence.
- Load a matching repository-local skill from `.agents/skills/` when available. Skills are guidance, not permission to merge, release, run installers, weaken security boundaries, or modify unrelated UI/copy.
- Treat renderer input, file paths, URLs, model names, persisted state, imported text, and downloaded data as untrusted data.
- Distinguish the default `master` baseline from the candidate architecture in `refactor/typescript-hardening` / PR #9 until that PR is merged.

## Skill routing

- Electron main/preload/IPC/security work: read `.agents/skills/electron-ipc-security/SKILL.md`.
- Ollama startup, model commands, request lifecycle, retries, generation, and cancellation: read `.agents/skills/ollama-runtime/SKILL.md`.
- TypeScript migration, tests, CI, build failures, dead code, or broad code-quality work: read `.agents/skills/typescript-quality/SKILL.md`.
- Bugs or failing CI: establish the exact failure and root cause before changing code. Do not stack speculative fixes.

## Project boundaries

- This is a Windows-first Electron desktop application using React, Zustand, Vite, Tailwind, TypeScript, and a local Ollama server.
- `src/shared/ipc.ts` is the canonical renderer/preload/main API contract. Do not duplicate IPC request or response types in renderer or preload code.
- Renderer code must never import Node or Electron privileged APIs directly. Privileged operations cross the preload bridge only.
- Preserve the candidate window policy: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and `webSecurity: true`. Navigation/new-window behavior and permission handling remain deny-by-default.
- Privileged IPC handlers must validate the sender and runtime input. TypeScript types do not replace runtime validation.
- Sender validation is not filesystem authorization. A renderer-provided path must not become sufficient authority for read/search/reveal after #11; preserve the main-owned grant model when implementing or reviewing filesystem work.
- Every new privileged string/binary/process capability needs a product-justified main-side resource budget. Do not rely on renderer controls as the limit. #13 owns the current missing budgets.
- Never construct shell command strings from renderer-controlled values. Prefer `spawn` with argument arrays or a dedicated Electron API.
- Do not kill arbitrary system Ollama processes as part of normal application shutdown. The app may automatically stop only the process instance it owns.
- Do not claim an owned Ollama process is stopped merely because `child.kill()` returned true; confirm the intended lifecycle state when implementing #15.
- External URLs are HTTPS-only unless a narrowly documented product requirement adds another protocol.
- Installer execution is a high-risk boundary. Current-session path equality is only one guard; it is not authenticity verification. Preserve it, then add bounded/atomic download and independent publisher/digest verification under #12.
- Image reads are format/size bounded. Do not remove those checks, but do not describe them as user authorization; #11 owns grants and #13 owns resource/race hardening.
- Generation cancellation uses request IDs. Do not regress Stop/Escape to a queue-only flag that leaves the active HTTP request running.
- Batch processing snapshots model, prompt, options, and preset at batch start. Do not imply that the queue itself is immutable: #14 owns deterministic mutation/cancellation semantics for participating items and active operations.
- Model/Ollama UI state must reflect confirmed main-process/runtime state. Do not preserve optimistic success logs or family-prefix model identity when implementing #15.
- Do not change authored UI copy, presets, prompt text, visual design, or keyboard mappings during infrastructure/refactor work unless the task explicitly requires it.

## TypeScript rules

- Production source and executable configuration are TypeScript/TSX. Do not add parallel `.js` implementations.
- Keep strict TypeScript checks enabled. Do not use `any`, blanket casts, `@ts-ignore`, or disabling compiler checks to make CI green.
- Shared domain/IPC contracts belong in `src/shared/`. Renderer-only view state belongs under `src/renderer/`; privileged runtime services belong under `src/main/`.
- Prefer explicit return types at security/process/service boundaries and `unknown` for untrusted runtime input.

## Testing and verification

- `npm run check` currently means strict renderer/main/node/test TypeScript checks plus the deterministic Node unit tests. It does **not** include the production build or Electron smoke.
- `npm run build` separately builds renderer and main.
- `npm run smoke:electron:run` is the existing Electron **boot smoke**. It uses a test-created `BrowserWindow` and mocked handlers to verify the built renderer/preload, React mount, and selected bridge functions.
- The current Windows CI runs `npm ci`, `npm run check`, `npm run build`, then `npm run smoke:electron:run` as distinct steps.
- Do not call the existing boot smoke full Electron E2E, real-main integration, packaged-runtime proof, or real Ollama proof. #16 owns those higher verification layers.
- A pull-request CI run is evidence for that PR context. Record the PR, associated head/base, run number, and conclusion rather than treating the head SHA alone as universal runtime proof.
- Unit tests should target durable pure contracts: validation, MIME mapping, URL/sender policy, retry/cancellation helpers, grants, migrations, resource limits, operation state, and other deterministic seams.
- For security/runtime changes, add the narrowest test at the layer that actually proves the invariant. Do not inflate a lower-level test into a higher-level claim.
- Before release-runtime confidence, require real application bootstrap smoke, packaged Windows smoke, and a separate real Ollama vision acceptance when relevant.
- When CI fails, read the exact failing step/log first, identify the root cause, make the smallest relevant change, and rerun the applicable gate.

## Dependency and upgrade policy

- Do not run `npm audit fix --force` or broad dependency upgrades as an incidental repair. Record each critical/high dependency chain, exposure, fix path, and owner under #10.
- Coordinate removal of confirmed unused direct dependencies with #6/#10 rather than creating competing lockfile changes.
- The filesystem-grant design in #11 should exist before the final drag/drop migration; #7 then integrates supported drag/drop path acquisition with that grant model while upgrading Electron/electron-builder deliberately.
- Do not preserve legacy `File.path` with casts or expose raw `webUtils`/Electron APIs through preload.
- Biome, Knip, and Playwright Electron are candidates, not mandatory dependencies. Add them only through a reviewable tooling change with a clear script, configuration, CI role, and maintenance owner.

## Git and external actions

- Work on a non-default branch unless the owner explicitly asks otherwise.
- Do not force-push, rebase, reset hard, or perform destructive cleanup as an incidental fix.
- GitHub Issues are the canonical engineering backlog. #18 is the current cross-cutting hardening/readiness map; dedicated Issues retain implementation ownership.
- Notion is the durable project/audit/context layer, not a competing source of executable truth.
- Do not merge a PR, publish a release, or mark an issue complete without fresh verification evidence appropriate to the claim being made.
