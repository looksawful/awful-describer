# Agent Context

Use this directory as a fast navigation layer. It does not override code, tests, package scripts, CI, `AGENTS.md`, or current GitHub Issues.

## Start here

- Project overview and commands: `README.md`
- Agent policy and skill routing: `AGENTS.md`
- Architecture and trust boundaries: `docs/architecture.md`
- Audit findings and issue mapping: `docs/audit-2026-09-09.md`
- Shared cross-process contract: `src/shared/ipc.ts`
- Main lifecycle: `src/main/main.ts`
- Privileged IPC: `src/main/ipc/`
- Ollama lifecycle: `src/main/services/ollamaService.ts`
- Renderer processing state: `src/renderer/stores/appStore.ts`
- Verification commands: `package.json`
- Windows CI: `.github/workflows/ci.yml`

## Current priorities

1. Keep PR #9 green under Windows CI.
2. Resolve P0 dependency-security issue #10 without blind forced upgrades.
3. Complete Electron upgrade #7 only after drag-and-drop is migrated away from `File.path`.
4. Add Electron runtime smoke/E2E coverage after the TypeScript/build baseline is stable.
5. Clean dead dependencies/persisted state under #6.

## Skills

- `.agents/skills/electron-ipc-security/SKILL.md`
- `.agents/skills/ollama-runtime/SKILL.md`
- `.agents/skills/typescript-quality/SKILL.md`

## Sources of truth

- Executable behavior: source code.
- Cross-process API: `src/shared/ipc.ts`.
- Verification: package scripts + current GitHub Actions result.
- Engineering backlog: GitHub Issues.
- Durable audit/project summary: repo docs and mirrored Notion documentation.
