---
name: typescript-quality
description: Use for TypeScript migration, strict typing, CI/build failures, tests, dead code/dependencies, or repository quality-gate work.
---

# TypeScript Quality

## Goal

Keep the repository TypeScript-first, strict, reproducible on Windows, and verified by the cheapest sufficient automated checks.

## Read first

- `AGENTS.md`
- `package.json`
- `tsconfig.json`
- `tsconfig.main.json`
- `tsconfig.node.json`
- `tsconfig.test.json`
- `.github/workflows/ci.yml`

## Migration rules

- Do not create parallel `.js` and `.ts` implementations.
- Shared cross-process contracts live in `src/shared/`.
- Prefer `unknown` plus runtime narrowing at boundaries; do not silence problems with `any`, `@ts-ignore`, or blanket casts.
- Keep `strict`, `noUnusedLocals`, and `noUnusedParameters` enabled unless a documented tool limitation requires a narrow exception.
- Remove obsolete JavaScript configs by migrating them to TypeScript or folding them into a TypeScript-owned configuration path supported by the tool.

## Debugging CI

1. Read the exact failed step and compiler/test output.
2. Reproduce the narrow failure conceptually or locally when possible.
3. Identify the root cause and the recent change or stale code that exposes it.
4. Make the smallest change that addresses that cause.
5. Push and inspect the fresh Windows CI run before moving to the next failure.
6. Do not bundle unrelated cleanup into a red-to-green CI repair.

## Test policy

- Unit tests use built-in `node:test` until a broader framework is justified.
- Prefer permanent tests for durable contracts: IPC validation, URL policy, MIME mapping, pure queue/request helpers, persistence migrations, and deterministic lifecycle state machines.
- Do not use snapshots to freeze incidental UI markup or authored prompt/copy text.
- Runtime Electron behavior requires smoke/E2E coverage; TypeScript unit tests cannot prove BrowserWindow/preload/native dialog behavior.

## Planned tools

- Biome: candidate for repository-wide lint/format after the baseline is green.
- Knip: candidate for dead files, unused exports, and unused dependency analysis.
- Playwright Electron: candidate for Windows smoke/E2E around app launch, file selection, queue processing, cancellation, and window behavior.

Add these only through an explicit tooling change with scripts, configuration, CI ownership, and documentation. Do not add them merely because they are fashionable pieces of developer furniture.

## Completion evidence

- `npm run check` passes.
- `npm run build` passes.
- The latest relevant GitHub Actions Windows run passes.
- Any unrun runtime/manual check is stated explicitly rather than implied.
