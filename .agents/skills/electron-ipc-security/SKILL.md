---
name: electron-ipc-security
description: Use for Electron main/preload/renderer bridge, IPC handlers, navigation policy, shell/file capabilities, installer flows, or security-sensitive desktop changes.
---

# Electron IPC Security

## Goal

Keep privileged Electron capabilities narrow, typed, runtime-validated, explicitly authorized, resource-bounded, and owned by the main process.

## Read first

- `AGENTS.md`
- `src/shared/ipc.ts`
- `src/main/preload.ts`
- `src/main/ipc/registerIpcHandlers.ts`
- `src/main/ipc/registerInstallerHandlers.ts`
- `src/main/window.ts`
- relevant current Issues, especially #11–#13 and #16

## Required pattern

1. Define or change the shared request/response shape in `src/shared/ipc.ts`.
2. Treat every renderer argument as `unknown` at the IPC boundary and validate it before use.
3. Verify the IPC sender is the trusted app renderer before privileged work.
4. Separately verify authorization/capability. Trusted sender identity does not make a renderer-provided path a user grant.
5. Apply a product-justified main-side resource limit to privileged payload/process/file operations.
6. Expose the smallest possible preload method. Do not expose raw `ipcRenderer`, raw `webUtils`, or a generic filesystem/process API.
7. Prefer dedicated Electron/Node APIs over shell strings.
8. Keep navigation, new-window behavior, permissions, and webviews deny-by-default.
9. Add or update deterministic tests for pure validation, authorization, resource, and policy logic.
10. Run the verification layer that actually proves the changed invariant; do not promote a unit/boot-smoke result into real-main/package evidence.

## Capability rules

- Filesystem: after #11, `read/search/reveal` must require live main-owned grants derived from an explicit user flow. Canonicalize and enforce grant scope in main; keep extension/size checks as defense in depth.
- Drag/drop: do not preserve renderer `File.path` with casts or a broad preload escape hatch. #7 must connect supported path acquisition to the #11 grant model.
- Shell URLs: HTTPS only by default. Add protocols/origins only with an explicit product need and tests.
- External processes: use `spawn(command, args, { shell: false })`; never interpolate renderer data into a command string.
- Installer: current-session path equality is only a provenance guard. Preserve it, but do not call an executable trusted until #12 has independently verified the exact downloaded artifact and bounded/atomic download lifecycle.
- Window policy: preserve `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and `webSecurity: true` unless a documented review proves a narrowly scoped change is required.
- Event listeners: remove the exact listener that was registered. Do not use `removeAllListeners` as component cleanup.

## Verification

The candidate Windows CI currently runs `npm ci`, `npm run check`, `npm run build`, and the existing Electron boot smoke. That smoke uses a test-created `BrowserWindow` with mocked handlers. It proves a renderer/preload boot path, not real handler integration, actual app bootstrap, packaged behavior, or Ollama inference.

#16 owns the higher verification layers. Record PR CI evidence with the applicable run plus associated head/base; do not transfer an older green result to a newer head.

## Review checklist

- Is there exactly one source of truth for the IPC shape?
- Does runtime validation exist despite TypeScript types?
- Is sender identity being confused with user authorization?
- Can a compromised trusted renderer expand its privileges with this handler?
- Does every privileged payload/path/process operation have an explicit limit and ownership model?
- Can a path, model name, URL, or content string reach a shell?
- Does malformed, unauthorized, oversized, or stale input fail closed?
- Does the change preserve sandbox/context isolation/nodeIntegration/webSecurity boundaries?
- Is the test evidence at the same layer as the claim being made?
