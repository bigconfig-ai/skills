---
name: create-clj-bigconfig-package
description: Scaffold a new minimal, launcher-conformant Clojure BigConfig package from bundled templates. Use when asked to create, bootstrap, or scaffold a new BigConfig package in Clojure — one that depends on the big-config SDK, exposes validate/build verbs, and runs via the bc-pkg launcher.
---

# Create a Clojure BigConfig package

This skill scaffolds a new, minimal **Clojure BigConfig package** from the bundled
templates in `templates/`. The result is the smallest thing that is a real package:
it depends only on the `big-config` SDK, renders one template through a single `hello`
stage, exposes `validate` + `build` verbs, ships a launcher-friendly root `run`, and
tests green. The author then grows it (more params, more stages).

It is the Clojure twin of `create-ts-bigconfig-package`; keep the three language skills
behaviourally consistent. Read `reference/checklist.md` for the conformance contract.
The authoritative spec is `once-bigconfig/main/src/pages/package-spec.html`.

## Step 1 — Collect inputs

Ask the user (offer the defaults; don't block on obvious answers):

| Input | Meaning | Default |
|---|---|---|
| package name | CLI / coordinate name (lowercase; hyphens allowed) | required |
| GitHub owner | owner used to build the reverse-DNS namespace | `bigconfig-ai` |
| description | one-line README description | `A minimal BigConfig package.` |
| target directory | where to create the package | `<name>/clojure` as a workspace sibling |
| SDK source | how to depend on `big-config` | GitHub SHA pin (see Step 2) |

## Step 2 — Derive the substitution tokens

Compute these once; every `.tmpl` file is filled by replacing them literally.

| Token | Derivation | Example (name `widget`, owner `bigconfig-ai`) |
|---|---|---|
| `__PKG_NAME__` | the package name verbatim (CLI, profile, fn names) | `widget` |
| `__PKG_OWNER__` | the GitHub owner | `bigconfig-ai` |
| `__PKG_NAMESPACE__` | dotted namespace (`ns` forms + engine step keywords) | `io.github.bigconfig-ai.widget` |
| `__PKG_NS_SRC_PATH__` | **source** path: hyphens → `_` (Clojure munging) | `io/github/bigconfig_ai/widget` |
| `__PKG_NS_RES_PATH__` | **resources** path: hyphens kept | `io/github/bigconfig-ai/widget` |
| `__PKG_COORD__` | `bb.edn` coordinate `io.github.<owner>/<name>` | `io.github.bigconfig-ai/widget` |
| `__PKG_DESC__` | the description | `A minimal BigConfig package.` |
| `__BIG_CONFIG_REF__` | SDK dep map value under `io.github.amiorin/big-config` | `{:git/sha "<sha>"}` |

**The load-bearing Clojure gotcha:** namespace declarations and `:require`s use hyphens
(`io.github.bigconfig-ai.widget.tools`) but the source files live at the **underscored**
path (`src/clj/io/github/bigconfig_ai/widget/tools.clj`); a hyphenated package name
munges in the path too (`my-widget` → `my_widget`). **Resources keep hyphens**
(`src/resources/io/github/bigconfig-ai/widget/…`). Derive `__PKG_NS_SRC_PATH__` and
`__PKG_NS_RES_PATH__` independently and use each in the right place, or namespaces won't
load / the renderer won't find the template. (Unlike TS/Python, Clojure symbols allow
hyphens, so the entry fns are simply `__PKG_NAME__` / `__PKG_NAME__*` — no separate
identifier token.)

For `__BIG_CONFIG_REF__`:
- **Default (publishable):** a GitHub SHA pin. Read the current SHA from a sibling leaf —
  `grep -A1 'amiorin/big-config' once/clojure/deps.edn | grep git/sha` — and use
  `{:git/sha "<sha>"}`.
- **Local SDK dev:** uncomment the `#_#_ io.github.amiorin/big-config {:local/root
  "../../big-config/clojure"}` line in `deps.edn` (and comment the `:git/sha` one). The
  relative path depends on where you create the package.

## Step 3 — Copy templates into the target directory

Create the target dir, then copy `templates/` into it with these renames:

- `templates/gitignore`               → `.gitignore`
- `templates/deps.edn.tmpl`           → `deps.edn`
- `templates/bb.edn.tmpl`             → `bb.edn`
- `templates/run.tmpl`                → `run`  (then `chmod +x run`)
- `templates/README.md.tmpl`          → `README.md`
- `templates/src/clj/pkg/`            → `src/clj/<PKG_NS_SRC_PATH>/`  (rename the `pkg`
  dir to the **underscored** namespace path; fill each `*.clj.tmpl`, dropping `.tmpl`)
- `templates/src/resources/tools/`    → `src/resources/<PKG_NS_RES_PATH>/tools/`
  (relocate under the **hyphenated** namespace path; `greeting.txt` is verbatim)
- `templates/test/clj/pkg/`           → `test/clj/<PKG_NS_SRC_PATH>/`  (underscored;
  fill `package_test.clj.tmpl`, dropping `.tmpl`)

Every `.clj` file contains tokens (each embeds the package namespace in its `ns` form),
so all of them are `*.tmpl`. Files with **no** tokens (copy verbatim): `greeting.txt`,
`gitignore`.

## Step 4 — Substitute tokens

Replace every token in the copied files with the Step 2 values. Be exact — the
hyphen/underscore split is the trap: `__PKG_NAMESPACE__` (hyphens) appears in `ns` forms
and `:require`s, while `__PKG_NS_SRC_PATH__` (underscores) and `__PKG_NS_RES_PATH__`
(hyphens) are only used to place directories in Step 3.

## Step 5 — Test and run

In the target directory:

```bash
clojure -M:test                                  # cognitect test-runner; expect 0 failures
bb run package validate                           # expect: All checks passed. (exit 0)
bb run package build                              # expect: renders .dist/<name>-<hash>/.../hello/greeting.txt
BC_PAR_NAME=REPLACE_ME bb run package validate    # expect: validation failed (exit 1)
```

All of these must succeed (the override case must *fail* validation — that proves
`BC_PAR_*` overrides reach the report). Confirm `.dist/` exists, holds the rendered
`greeting.txt` containing `Hello, world!`, and is git-ignored.

## Step 6 — Report

Print `reference/checklist.md` with each item confirmed, then tell the user how to grow
the package (edit the profile in `options.clj` + `run`, add stages in `tools.clj` and
the `build` pipeline + `tool-workflows` in `package.clj`, override params with
`BC_PAR_*`) and how to make it `bc-pkg`-installable: push to GitHub and run
`uvx bc-pkg <owner>/<name>@<ref> package build` / `npx bc-pkg <owner>/<name>@<ref>
package build` (either launcher targets a Clojure package), or for local dev the local
path form.

## Notes

- Boundary keys (profile/template params) stay kebab-case **keywords** matching template
  variable names (`:package`, `:name`).
- The launcher runtime command for a Clojure target is `bb run …` (there is no Clojure
  implementation of `bc-pkg` itself — only Clojure *target* support).
- Never write real credentials; placeholders only.
- `.dist/` is generated output — never edit it as source.
- This skill lives in its own directory inside the `skills/` repository. To make it an
  auto-discovered slash command, place or symlink this `create-clj-bigconfig-package/`
  directory under `.claude/skills/`.
