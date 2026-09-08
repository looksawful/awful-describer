---
name: electron-ipc-security
description: Use for Electron main/preload/renderer bridge, IPC handlers, navigation policy, shell/file capabilities, installer flows, or security-sensitive desktop changes.
---

# Electron IPC Security

## Goal

Keep privileged Electron capabilities narrow, typed, runtime-validated, and owned by the main process.

## Read first

- `AGENTS.md`
- `src/shared/ipc.ts`
- `src/main/preload.ts`
- `src/main/ipc/registerIpcHandlers.ts`
- `src/main/ipc/registerInstallerHandlers.ts`
- `src/main/window.ts`

## Required pattern

1. Define or change the shared request/response contract in `src/shared/ipc.ts`.
2. Treat every renderer argument as `unknown` at the IPC boundary and validate it before use.
3. Verify the IPC sender is the trusted app renderer before privileged work.
4. Expose the smallest possible preload method. Do not expose raw `ipcRenderer`.
5. Prefer dedicated Electron/Node APIs over shell strings.
6. Keep navigation and new-window behavior deny-by-default.
7. Add or update deterministic tests for pure validation/policy logic.
8. Run `npm run check` and `npm run build` and verify Windows CI before reporting success.

## Capability rules

- Filesystem: accept only paths required by a user-selected or explicit app flow; keep image reads bounded.
- Shell URLs: HTTPS only by default. Add protocols/origins only with an explicit product need and tests.
- External processes: use `spawn(command, args, { shell: false })`; never interpolate renderer data into a command string.
- Installer: launch only the installer path created by the current app download session.
- Window navigation: block unexpected navigation and `window.open`; open allowed external HTTPS targets outside the renderer.
- Event listeners: remove the exact listener that was registered. Do not use `removeAllListeners` as component cleanup.

## Review checklist

- Is there exactly one source of truth for the IPC type?
- Does runtime validation exist despite TypeScript types?
- Can a compromised renderer expand its privileges with this handler?
- Can a path, model name, URL, or content string reach a shell?
- Does the handler fail closed on malformed input?
- Does the change preserve sandbox/context isolation/nodeIntegration boundaries?
- Is the capability narrower after the change, or at least no broader?
