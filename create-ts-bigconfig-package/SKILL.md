---
name: create-ts-bigconfig-package
description: Scaffold a new minimal, launcher-conformant TypeScript BigConfig package from bundled templates. Use when asked to create, bootstrap, or scaffold a new BigConfig package in TypeScript — one that depends on the big-config SDK, exposes package validate/describe/build/create/delete lifecycle verbs, and runs via the bc-pkg launcher.
---

# Create a TypeScript BigConfig package

This skill scaffolds a new, minimal **TypeScript BigConfig package** from the bundled
templates in `templates/`. The result is the smallest thing that is a real package:
it depends only on the `big-config` SDK, renders one template through a single `hello`
stage, exposes `package validate`, `package describe`, `package build`,
`package create`, and `package delete`, ships a launcher-friendly root `run`, and
builds/tests green. The author then grows it (more params, more stages).

Read `reference/checklist.md` for the conformance contract the output must satisfy.
The authoritative spec is `once-bigconfig/main/src/pages/package-spec.html`.

## Step 1 — Collect inputs

Ask the user (offer the defaults; don't block on obvious answers):

| Input | Meaning | Default |
|---|---|---|
| package name | npm package + CLI name (lowercase; hyphens allowed) | required |
| GitHub owner | owner used to build the reverse-DNS namespace | `bigconfig-ai` |
| description | one-line `package.json` description | `A minimal BigConfig package.` |
| target directory | where to create the package | `<name>/typescript` as a workspace sibling |
| SDK source | how to depend on `big-config` | GitHub SHA pin (see Step 2) |

## Step 2 — Derive the substitution tokens

Compute these once; every `.tmpl` file is filled by replacing them literally.

| Token | Derivation | Example (name `widget`, owner `bigconfig-ai`) |
|---|---|---|
| `__PKG_NAME__` | the package name verbatim (npm name, dir, CLI) | `widget` |
| `__PKG_VAR__` | a JS identifier from the name (camelCase; strip non-alnum) | `widget` (`my-widget` → `myWidget`) |
| `__PKG_OWNER__` | the GitHub owner | `bigconfig-ai` |
| `__PKG_NAMESPACE__` | `io.github.<owner>.<name>` with non-alnum → nothing/dots as in existing leaves | `io.github.bigconfig-ai.widget` |
| `__PKG_NS_PATH__` | the namespace as a path (dots → `/`) | `io/github/bigconfig-ai/widget` |
| `__PKG_DESC__` | the description | `A minimal BigConfig package.` |
| `__BIG_CONFIG_REF__` | the `big-config` dependency spec | `github:bigconfig-ai/big-config#<sha>` |

For `__BIG_CONFIG_REF__`:
- **Default (publishable):** a GitHub SHA pin. Read the current SHA from a sibling
  leaf — `grep -o 'big-config#[0-9a-f]*' once/typescript/package.json` — and use
  `github:bigconfig-ai/big-config#<sha>`.
- **Local SDK dev:** `file:<relative-path-to>/big-config/typescript`. The relative
  path depends on where you create the package. For `<name>/typescript` as a workspace
  sibling it is `file:../../big-config/typescript`. Pick this if the user wants to
  develop against local SDK source (offline-friendly).

## Step 3 — Copy templates into the target directory

Create the target dir, then copy `templates/` into it with these renames:

- `templates/gitignore`            → `.gitignore`
- `templates/package.json.tmpl`    → `package.json`
- `templates/tsconfig.json`        → `tsconfig.json` (verbatim)
- `templates/vitest.config.ts`     → `vitest.config.ts` (verbatim)
- `templates/run.tmpl`             → `run`  (then `chmod +x run`)
- `templates/README.md.tmpl`       → `README.md`
- `templates/src/cli.ts.tmpl`      → `src/cli.ts`
- `templates/src/pkg/`             → `src/<PKG_NAME>/`  (rename the `pkg` dir; the
  files `describe.ts`, `interop.ts`, `params.ts`, and `validation.ts` are verbatim,
  the `*.tmpl` files are filled, dropping the `.tmpl` suffix)
- `templates/src/resources/tools/` → `src/resources/<PKG_NS_PATH>/tools/`  (relocate
  under the namespace path; `greeting.txt` is verbatim)
- `templates/test/*.tmpl`          → `test/*` (drop `.tmpl`)

Files that contain tokens (`*.tmpl`): `package.json`, `run`, `README.md`, `cli.ts`,
`src/<name>/options.ts`, `src/<name>/tools.ts`, `src/<name>/package.ts`,
`test/build.test.ts`, `test/validation.test.ts`. Files with **no** tokens (copy
verbatim): `tsconfig.json`, `vitest.config.ts`, `gitignore`, `describe.ts`,
`interop.ts`, `params.ts`, `validation.ts`, `greeting.txt`.

## Step 4 — Substitute tokens

Replace every token in the copied files with the Step 2 values. Be exact — these are
load-bearing: `__PKG_VAR__` produces valid JS identifiers (`export const <var>`,
`<var>Star`), while `__PKG_NAMESPACE__` produces the step names and must match the
`__PKG_NS_PATH__` you used to relocate the resource directory (otherwise the renderer
won't find the template).

## Step 5 — Install, build, test, run

In the target directory:

```bash
npm install
npm run build
npm run typecheck
npm test
node run package validate          # expect: All checks passed. (exit 0)
node run package describe          # expect: prints package/profile/name summary (exit 0)
node run package build             # expect: renders .dist/<name>-<hash>/.../hello/greeting.txt
node run package create            # expect: safe demo create; renders the same top-level .dist dir
node run hello render              # expect: renders the same top-level .dist dir as package build
node run package delete            # expect: explicit no-op success (exit 0)
BC_PAR_NAME=REPLACE_ME node run package validate   # expect: validation failed (exit 1)
```

All of these must succeed (the override case must *fail* validation — that proves
`BC_PAR_*` overrides reach the report). Confirm `.dist/` exists after `build`,
`create`, and `hello render`; `package build`, `package create`, and `hello render`
use the same top-level `.dist/<name>-<hash>/` directory; the rendered
`greeting.txt` contains `Hello, world!`; and `.dist/` is git-ignored.

## Step 6 — Report

Print `reference/checklist.md` with each item confirmed, then tell the user how to grow
the package (edit the profile in `options.ts` + `run`, add stages in `tools.ts` and the
`build`/`create` pipelines in `package.ts`, override params with `BC_PAR_*`) and how
to make it
`bc-pkg`-installable: push to GitHub and run
`npx bc-pkg <owner>/<name>@<ref> package build`, or for local dev
`npx bc-pkg ../<name>/typescript package build`.

## Notes

- Keep imports using explicit `.js` extensions (required by `NodeNext` resolution).
- Profile/param keys stay kebab-case strings matching template variable names.
- Never write real credentials; placeholders only.
- `.dist/` is generated output — never edit it as source.
- This skill lives in its own directory inside the `skill/` skills repository (see the
  repo `README.md`). To make it an auto-discovered slash command, place or symlink this
  `create-ts-bigconfig-package/` directory under `.claude/skills/`.
