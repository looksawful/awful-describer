---
name: typescript-quality
description: Use for TypeScript migration, strict typing, CI/build failures, tests, dead code/dependencies, or repository quality-gate work.
---

# TypeScript Quality

## Goal

Keep the repository TypeScript-first, strict, reproducible on Windows, and verified by the cheapest automated layer that actually proves the claim.

## Read first

- `AGENTS.md`
- `package.json`
- `tsconfig.json`
- `tsconfig.main.json`
- `tsconfig.node.json`
- `tsconfig.test.json`
- `.github/workflows/ci.yml`
- current PR/Issues relevant to the change

## Migration rules

- Do not create parallel `.js` and `.ts` implementations.
- Shared cross-process contracts live in `src/shared/`.
- Prefer `unknown` plus runtime narrowing at boundaries; do not silence problems with `any`, `@ts-ignore`, blanket casts, or disabled checks.
- Keep `strict`, `noUnusedLocals`, and `noUnusedParameters` enabled unless a documented tool limitation requires a narrow exception.
- Remove obsolete JavaScript configs by migrating them to TypeScript or folding them into a TypeScript-owned configuration path supported by the tool.

## Debugging CI

1. Read the exact failed step and compiler/test output.
2. Identify what that step is intended to prove.
3. Reproduce the narrow failure locally or through deterministic reasoning when possible.
4. Find the root cause rather than stacking speculative fixes.
5. Make the smallest relevant change.
6. Push and inspect the fresh applicable Windows CI run before claiming the branch/PR is green.
7. Do not bundle unrelated cleanup into a red-to-green repair.

## Test policy

- Unit tests use built-in `node:test` until a broader framework is justified.
- Prefer permanent tests for durable contracts: IPC validation, URL/sender policy, MIME mapping, filesystem grants, resource limits, persistence migrations, queue/request helpers, and deterministic lifecycle state machines.
- Do not use snapshots to freeze incidental UI markup or authored prompt/copy text.
- The existing Electron boot smoke uses a test-created `BrowserWindow` and mocked handlers. Preserve it as a narrow renderer/preload regression layer.
- TypeScript unit tests and the existing boot smoke cannot prove actual `main.ts` bootstrap, real handler integration, packaged paths, native dialogs, or Ollama inference. #16 owns those higher layers.

## Tool candidates

- Biome: candidate for repository-wide lint/format after low-noise evaluation.
- Knip: candidate for dead files, unused exports, and unused dependency analysis.
- Playwright Electron: candidate for real-app/package runtime tests when its maintenance cost is justified.

Add tooling only through an explicit change with scripts, configuration, CI ownership, and documentation. A fashionable tool with no owner is merely future archaeology with a lockfile.

## Current verification semantics

- `npm run check`: strict renderer/main/node/test TypeScript checks + current Node unit tests.
- `npm run build`: production renderer/main build.
- `npm run smoke:electron:run`: existing synthetic Electron boot smoke.
- Current Windows CI runs `npm ci` → `npm run check` → `npm run build` → `npm run smoke:electron:run`.

For pull-request evidence, record the specific run and its associated head/base. An older successful run does not make a newer head green by inheritance.

## Completion evidence

Before reporting a change complete:

- the applicable type/unit/build checks pass;
- any changed runtime boundary has a test at the layer that actually proves it;
- the latest relevant Windows CI result is checked rather than assumed;
- any unrun main-integration, packaged, Ollama, GPU, or manual check is stated explicitly rather than implied;
- dependency counts are refreshed after lockfile changes instead of copied from an old audit snapshot.
