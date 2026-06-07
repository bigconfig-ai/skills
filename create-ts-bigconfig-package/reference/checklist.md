# BigConfig package conformance checklist

A generated TypeScript package should satisfy all of these (from the BigConfig
Package Spec — see `once-bigconfig/main/src/pages/package-spec.html`). Print this
with each item confirmed after scaffolding.

- [ ] **Exactly one root manifest.** `package.json` at the package root, and no
      `deps.edn` / `pyproject.toml` beside it (multiple manifests are ambiguous to
      `bc-pkg`).
- [ ] **Package name declared.** `package.json` `name` is set; the launcher uses it.
- [ ] **Root `run` exists** and is the user-facing entry point. It forwards `argv`
      and passes a default profile/options map into the CLI.
- [ ] **`run` is safe to copy.** It carries editable placeholders only (`REPLACE_ME`,
      `world`) and no real credentials.
- [ ] **Resources are shipped.** `package.json` `files` includes `src/resources` and
      the built `dist/src`, so templates exist in the installed artifact.
- [ ] **Installable from a GitHub SHA** (`big-config` dep pins a 40-char commit) and
      **from a local path** (`file:../../big-config/typescript`) for SDK dev.
- [ ] **Lifecycle commands run.** `node run package validate`,
      `node run package describe`, `node run package build`,
      `node run package create`, and `node run package delete` succeed; build and
      create emit output under `.dist/`.
- [ ] **Params are kebab-case** strings matching template variable names; runtime
      overrides work via `BC_PAR_*`.
- [ ] **`.dist/` is generated**, git-ignored, and never edited as source.
- [ ] **Build, typecheck, and tests pass** (`npm run build`, `npm run typecheck`,
      `npm test`).
