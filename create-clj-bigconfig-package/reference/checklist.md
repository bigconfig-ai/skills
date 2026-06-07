# BigConfig package conformance checklist (Clojure)

A generated Clojure package should satisfy all of these (from the BigConfig Package
Spec — see `once-bigconfig/main/src/pages/package-spec.html`). Print this with each
item confirmed after scaffolding.

- [ ] **Exactly one root manifest.** `deps.edn` at the package root, and no
      `package.json` / `pyproject.toml` beside it (multiple manifests are ambiguous to
      `bc-pkg`). A `bb.edn` for the `bb run` runtime sits alongside it.
- [ ] **Package coordinate declared.** `bb.edn` references `io.github.<owner>/<name>`
      via `:local/root "."`.
- [ ] **Root `run` exists** and is the user-facing entry point (`#!/usr/bin/env bb`).
      It forwards `*command-line-args*` and passes a `default-profile` into the CLI.
- [ ] **`run` is safe to copy.** It carries editable placeholders only (`world`) and no
      real credentials.
- [ ] **Resources are on `:paths`.** `deps.edn` `:paths` includes `src/resources`, so
      templates are on the classpath at runtime.
- [ ] **Installable from a GitHub SHA** (`io.github.amiorin/big-config {:git/sha …}`)
      and **from a local path** (commented `:local/root "../../big-config/clojure"`).
- [ ] **Source vs resource paths.** Source dirs munge hyphens to underscores
      (`src/clj/io/github/bigconfig_ai/<pkg>`); resources keep hyphens
      (`src/resources/io/github/bigconfig-ai/<pkg>`).
- [ ] **Lifecycle commands run.** `bb run package validate` and `bb run package build`
      succeed; build emits output under `.dist/`.
- [ ] **Params are kebab-case keywords** matching template variable names; runtime
      overrides work via `BC_PAR_*`.
- [ ] **`.dist/` is generated**, git-ignored, and never edited as source.
- [ ] **Tests pass** (`clojure -M:test`).
