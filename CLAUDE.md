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

## The template-token convention (`create-ts-bigconfig-package`)

This skill scaffolds a TypeScript BigConfig package by copying `templates/` and doing
literal string substitution. When editing it, preserve these load-bearing rules:

- **`.tmpl` suffix = contains tokens.** A file named `*.tmpl` carries `__TOKEN__`
  placeholders and is filled then renamed (dropping `.tmpl`). A file **without** `.tmpl`
  (e.g. `interop.ts`, `params.ts`, `validation.ts`, `tsconfig.json`) is copied verbatim —
  do not put tokens in those. `SKILL.md` Step 3 lists every rename; keep it in sync if you
  add/remove/rename a template file.
- **Tokens are coupled, not independent.** `__PKG_NAMESPACE__` (e.g.
  `io.github.bigconfig-ai.widget`) produces the workflow step names *and* must match
  `__PKG_NS_PATH__` (the same value with dots → `/`), which is where the resource template
  directory is relocated. If they diverge, the renderer can't find the template at runtime.
  `__PKG_VAR__` must be a valid JS identifier (it becomes `export const <var>` and
  `<var>Star`).
- **Boundary keys stay kebab-case strings** matching template variable names (`package`,
  `name`) — not camelCase/snake_case. Engine reserved keys are namespaced strings imported
  from `big-config`. This mirrors the workspace-wide convention in `../CLAUDE.md`.
- **`big-config` dependency** is pinned two ways: a 40-char GitHub SHA (publishable
  default) or `file:../../big-config/typescript` (local SDK dev). The SHA is read from a
  sibling leaf, not hardcoded here.

## What the generated package looks like (so edits stay consistent)

The templates produce the minimal real package: depends only on the `big-config` SDK,
renders one `hello` stage from one template directory, and exposes `validate` + `build`.

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

## Verifying a change to this skill

There is nothing to run in this repo. To check that an edit to the skill still works,
follow `SKILL.md` Step 5 in a scaffolded package: `npm install && npm run build &&
npm run typecheck && npm test`, then `node run package validate` (exit 0),
`node run package build` (renders `.dist/<name>-<hash>/.../hello/greeting.txt` containing
`Hello, world!`), and `BC_PAR_NAME=REPLACE_ME node run package validate` (must **fail**,
exit 1 — proving overrides reach the report). `reference/checklist.md` is the conformance
contract the output must satisfy.
