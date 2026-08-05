# T00 Correction v1.1 — source/dist audit basis

## Reason

PR #17 correctly added a read-only audit tool and reports, but the first implementation used `index.html` as the source side of source/dist checks.

`index.html` is only the GitHub Pages entry/redirect. The actual mobile build input is `prototype/mamoken_prototype_v01.html`, as defined by `tools/build_mobile.mjs`.

## Correction

- Separate runtime source, Pages entry, build script, generated dist, and server boundary.
- Parse `BAL`, `CHARS`, and `POSE_IDS` from both runtime source and generated dist.
- Compare those contracts structurally.
- Verify that `index.html` redirects to the generated dist.
- Verify that `tools/build_mobile.mjs` uses the audited runtime source.
- Fail the audit command if any source/dist contract check is false.
- Correct `reports/design_audit_v1.md` and regenerate `reports/current_impl_sync_scope.md`.

## Scope

No runtime, BAL value, asset, server, online protocol, or generated dist behavior is changed.

## T02 gate

T02 may start only after:

```bash
node tools/audit_current_impl.mjs
npm run build:mobile
node tools/audit_current_impl.mjs
git diff --check
```

all succeed and the generated source/dist contract checks are all `true`.
