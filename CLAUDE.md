# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills)
for working in the BigConfig workspace. It has **no build system and no tests of its
own** — it is documentation (`SKILL.md` procedures), `reference/` docs, and `templates/`
that a skill copies and customizes. "Editing here" means editing prose, checklists, and
template files, not compiling or running anything in this directory.

This repo sits inside the larger BigConfig polyrepo. The workspace-level architecture
(the `selmer → big-config SDK → once / walter` chain, the `bc-pkg` launcher, per-leaf
conventions) is documented in the parent `../CLAUDE.md`. Read it when a skill's output
must conform to those projects — the skills here generate code that has to satisfy that
contract.

## Layout

```
skills/
├── README.md                 # index of skills + how to author one
└── <skill-name>/             # one directory per skill, named after the skill's `name:`
    ├── SKILL.md              # frontmatter (name, description) + the procedure
    ├── reference/            # optional supporting docs / checklists
    └── templates/            # optional files the skill copies & customizes
```

Paths inside a `SKILL.md` (`templates/...`, `reference/...`) are **relative to that
skill's own directory**, not the repo root.

## Making a skill runnable

Skills here are not auto-discovered. To use one as a `/<name>` slash command, symlink its
directory under a discovered location:

```sh
ln -s "$PWD/create-ts-bigconfig-package" ~/.claude/skills/create-ts-bigconfig-package
```

## The template-token convention (all three skills)

`create-ts-bigconfig-package`, `create-py-bigconfig-package`, and
`create-clj-bigconfig-package` each scaffold a BigConfig package by copying `templates/`
and doing literal string substitution. When editing any of them, preserve these
load-bearing rules:

- **`.tmpl` suffix = contains tokens.** A file named `*.tmpl` carries `__TOKEN__`
  placeholders and is filled then renamed (dropping `.tmpl`). A file **without** `.tmpl`
  (e.g. TS `interop.ts`/`tsconfig.json`, Python `interop.py`/`__init__.py`, or
  `greeting.txt`/`gitignore` everywhere) is copied verbatim — do not put tokens in those.
  Each `SKILL.md` Step 3 lists every rename; keep it in sync if you add/remove/rename a
  template file. (Note: in **Clojure** every `.clj` is `*.tmpl`, because each file's `ns`
  form embeds the package namespace.)
- **Namespace tokens are coupled to resource placement.** `__PKG_NAMESPACE__` (e.g.
  `io.github.bigconfig-ai.widget`) produces the workflow step names *and* must match the
  path where the resource template directory is relocated, or the renderer can't find the
  template at runtime. The resource path token keeps hyphens (`__PKG_NS_PATH__` in TS/Py,
  `__PKG_NS_RES_PATH__` in Clojure).
- **Per-language identifier gotchas:**
  - **TS** — `__PKG_VAR__` must be a valid JS identifier (it becomes `export const <var>`
    and `<var>Star`); derived from the name as camelCase (`my-widget` → `myWidget`).
  - **Python** — `__PKG_MODULE__` must be a valid module identifier (snake_case;
    `my-widget` → `my_widget`); it is the `src/<module>/` dir, `[project.scripts]` /
    `packages` targets, every intra-package import, and the entry fns `<module>` /
    `<module>_star`. Distinct from `__PKG_NAME__` (the PyPI/CLI name).
  - **Clojure** — symbols allow hyphens, so the entry fns are just `__PKG_NAME__` /
    `__PKG_NAME__*` (no identifier token). The trap is paths: **source** dirs munge
    hyphens to underscores (`__PKG_NS_SRC_PATH__`, e.g. `io/github/bigconfig_ai/widget`)
    while **resources** keep hyphens (`__PKG_NS_RES_PATH__`). `ns` forms / `:require`s use
    the hyphenated dotted `__PKG_NAMESPACE__`. Derive the two path tokens independently.
- **Boundary keys stay kebab-case** matching template variable names (`package`, `name`) —
  strings in TS/Python, keywords in Clojure; not camelCase/snake_case. Engine reserved
  keys are namespaced. This mirrors the workspace-wide convention in `../CLAUDE.md`.
- **`big-config` dependency** is pinned two ways: a GitHub SHA (publishable default) or a
  local-path override for SDK dev — `file:../../big-config/typescript` (TS),
  editable `[tool.uv.sources]` (Python), `:local/root "../../big-config/clojure"`
  (Clojure). The SHA is read from a sibling leaf, not hardcoded here.

## What the generated package looks like (so edits stay consistent)

All three skills produce the same minimal real package, translated idiomatically per
language: depends only on the `big-config` SDK, renders one `hello` stage from one
template directory, and exposes `validate` + `build`. The TypeScript file map below is the
reference shape; Python (`src/<module>/*.py`) and Clojure
(`src/clj/<ns-path>/*.clj`) mirror it module-for-module (`cli`, `options`, `params`,
`tools`, `validation`, `package`; TS/Python also have `interop`).

- `src/cli.ts` — `main(argv, opts)` dispatches `package` / `validate` / `hello`.
- `src/<name>/package.ts` — assembles the workflow: registers tool stages via
  `registerWorkflow`, builds the `build` pipeline with `createWorkflowStar`, and threads
  `validate`/`build` fns through `createWorkflow`. Exports `<var>` and `<var>Star`.
- `src/<name>/tools.ts` — the `hello` stage; `templatePath` resolves the packaged template
  dir from its namespaced name across candidate locations.
- `src/<name>/options.ts` — profiles composed left-to-right; the active one is the `bb`
  binding.
- `src/<name>/validation.ts` — pure `validateReport` + a `validate` workflow step;
  flags blank or `REPLACE_ME` params and honors `BC_PAR_*` overrides.
- root `run` — launcher entry point copied into the user's project by `bc-pkg`; holds a
  user-editable default profile and **no real credentials**.

Imports use explicit `.js` extensions (required by `NodeNext`).

## Verifying a change to a skill

There is nothing to run in this repo. To check that an edit still works, scaffold a
package and follow that skill's Step 5. Each ends the same way: `validate` exits 0,
`build` renders `.dist/<name>-<hash>/.../hello/greeting.txt` containing `Hello, world!`,
and `BC_PAR_NAME=REPLACE_ME … validate` must **fail** with exit 1 (proving overrides reach
the report). The per-language commands:

- **TS:** `npm install && npm run build && npm run typecheck && npm test`, then
  `node run package validate` / `node run package build`.
- **Python:** `uv sync && uv run pytest -q`, then
  `uv run python run package validate` / `uv run python run package build`.
- **Clojure:** `clojure -M:test`, then `bb run package validate` / `bb run package build`.

Each skill's `reference/checklist.md` is the conformance contract the output must satisfy.
A good extra check is to re-instantiate from the templates with a **hyphenated** name
(e.g. `data-box`) to confirm the identifier/path derivations hold and no `__TOKEN__`
remains.
