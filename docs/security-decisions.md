# Security Audit Decisions

Conscious decisions made when reviewing `npm audit` findings. Each entry records what was found, why it was not directly fixed, and what condition would prompt revisiting.

---

## postcss XSS via unescaped `</style>` (GHSA-qx2v-qp2m-jg93)

**Severity:** Moderate  
**Affected path:** `node_modules/next/node_modules/postcss` (next's internal bundled copy)  
**Our direct `postcss` devDependency:** already at 8.5.13 — unaffected  
**Reviewed:** 2026-05-01 (issue #119)

**Decision:** Wait for Next.js to update its internal postcss dependency.

**Rationale:** The vulnerable postcss copy lives inside next's own node_modules tree and is used during the Next.js build pipeline, not to serve user requests. The XSS vector requires an attacker to control CSS input fed to postcss's stringify output — not a realistic attack surface in a server-side build tool. Running `npm audit fix --force` would downgrade next from 16.x to 9.x, which is far more harmful than the vulnerability itself.

**Revisit when:** Next.js ships a release that resolves the advisory (i.e., `npm audit` no longer reports this path), or if the threat model changes to include user-controlled CSS input.

---

## @hono/node-server middleware bypass (GHSA-92pp-h63x-v22m)

**Severity:** Moderate  
**Affected path:** `node_modules/prisma/node_modules/@prisma/dev` → `@hono/node-server@1.19.11`  
**Reviewed:** 2026-05-01 (issue #119)

**Decision:** Wait for Prisma to update `@prisma/dev`'s dependency on `@hono/node-server`.

**Rationale:** `@prisma/dev` is Prisma's internal CLI tooling (used only during `prisma generate` / `prisma db push`). The vulnerable `@hono/node-server` is never started in our application at runtime. Running `npm audit fix --force` would downgrade prisma from 7.x to 6.x. The attack surface requires the hono static-file server to be running and receiving requests, which it never is in this project.

**Revisit when:** Prisma ships a release with `@prisma/dev` pinned to `@hono/node-server >= 1.19.13`, or if `@prisma/dev` becomes part of our runtime dependency tree.

---

## ESLint 10.x upgrade (blocked)

**Current version:** 9.39.4 (latest in the 9.x line)  
**Available:** 10.3.0  
**Reviewed:** 2026-05-01 (issue #119)

**Decision:** Do not upgrade to ESLint 10 yet — blocked by `eslint-plugin-react`.

**Rationale:** `eslint-plugin-react@7.37.5` (bundled inside `eslint-config-next`) uses `context.getFilename()` which was removed in ESLint 10. The plugin's peer deps only declare support up to `eslint@^9.7`. Upgrading ESLint 10 causes a hard crash on any linted file: `TypeError: contextOrFilename.getFilename is not a function`. Upgrade was attempted and reverted.

The blocker chain: `eslint-config-next` bundles `eslint-plugin-react@^7.37.x` → that plugin's peerDeps cap at ESLint 9 → no 7.x release supports ESLint 10 → `eslint-plugin-react@8.x` is still in RC.

**Revisit when:** Either `eslint-plugin-react@8.x` goes stable and `eslint-config-next` adopts it, or `eslint-config-next` updates to declare `eslint: '>=10'` as a valid peer.
