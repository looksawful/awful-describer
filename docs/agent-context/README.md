# Agent Context

Use this directory as a fast navigation layer. It does not override code, tests, package scripts, CI, `AGENTS.md`, current PR state, or current GitHub Issues.

## Start here

- Project overview and commands: `README.md`
- Agent policy and skill routing: `AGENTS.md`
- Architecture and trust boundaries: `docs/architecture.md`
- Historical audit and issue mapping: `docs/audit-2026-09-09.md`
- Shared cross-process contract: `src/shared/ipc.ts`
- Main lifecycle: `src/main/main.ts`
- Privileged IPC: `src/main/ipc/`
- Ollama lifecycle: `src/main/services/ollamaService.ts`
- Renderer processing state: `src/renderer/stores/appStore.ts`
- Verification commands: `package.json`
- Windows CI: `.github/workflows/ci.yml`

## Current priorities

Use #18 as the cross-cutting completion map; dedicated Issues retain implementation ownership.

1. Get fresh successful Windows pull-request CI for the current PR #9 head/base after documentation or code changes.
2. Resolve #10 from a fresh dependency/audit snapshot without blind forced upgrades.
3. Define #11 filesystem grants, #13 resource budgets, and #6 versioned/validated persistence.
4. Stabilize operation semantics under #12 installer, #14 queue/operation state, and #15 Ollama/model state.
5. Use #7 to remove legacy `File.path`, connect drag/drop to the grant model, and upgrade Electron/electron-builder deliberately.
6. Expand verification under #16 beyond the existing synthetic Electron boot smoke to main integration, real application bootstrap, packaged Windows, and separate real Ollama vision acceptance.
7. Keep #17 renderer/offline polish behind the security/runtime checkpoints unless a specific item blocks packaged verification.

## Current verification boundary

The candidate already has strict TypeScript checks, Node unit tests, production build, and an Electron boot smoke. The boot smoke creates a test `BrowserWindow` with mocked handlers and checks built renderer/preload behavior. Do not call it full Electron E2E, real-main integration, packaged-runtime proof, or Ollama inference evidence.

For PR CI evidence, record the run together with its associated head and base. Do not transfer an older green result onto a newer branch head.

## Skills

- `.agents/skills/electron-ipc-security/SKILL.md`
- `.agents/skills/ollama-runtime/SKILL.md`
- `.agents/skills/typescript-quality/SKILL.md`

## Sources of truth

- Executable behavior: source code.
- Cross-process API shape: `src/shared/ipc.ts`.
- Filesystem authorization/resource policy: current implementation plus owner Issues #11/#13 until completed.
- Verification: package scripts + workflow + the specific applicable GitHub Actions run.
- Engineering backlog: GitHub Issues; #18 is the completion map.
- Durable audit/project context: repository docs and mirrored Notion documentation.
