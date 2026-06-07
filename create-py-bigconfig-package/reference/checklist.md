# BigConfig package conformance checklist (Python)

A generated Python package should satisfy all of these (from the BigConfig Package
Spec — see `once-bigconfig/main/src/pages/package-spec.html`). Print this with each
item confirmed after scaffolding.

- [ ] **Exactly one root manifest.** `pyproject.toml` at the package root, and no
      `deps.edn` / `package.json` beside it (multiple manifests are ambiguous to
      `bc-pkg`).
- [ ] **Package name declared.** `[project].name` is set; the launcher uses it.
- [ ] **Root `run` exists** and is the user-facing entry point. It forwards `argv` and
      passes a default profile/options map into the CLI.
- [ ] **`run` is safe to copy.** It carries editable placeholders only (`world`) and no
      real credentials.
- [ ] **Resources are shipped.** `[tool.hatch.build.targets.wheel].force-include`
      includes `src/resources`, so templates exist in the installed artifact.
- [ ] **Installable from a GitHub SHA** (`big-config @ git+https://…@<40-char-sha>`) and
      **from a local path** (editable `[tool.uv.sources]`) for SDK dev.
- [ ] **Lifecycle commands run.** `uv run python run package validate`,
      `uv run python run package describe`, `uv run python run package build`,
      `uv run python run package create`, `uv run python run hello render`, and
      `uv run python run package delete` succeed; build, create, and hello render
      emit output under `.dist/`.
- [ ] **Direct tool render matches package build.** `uv run python run hello render`
      and `uv run python run package build` create the same top-level
      `.dist/<profile>-<hash>/` directory.
- [ ] **Params are kebab-case** strings matching template variable names; runtime
      overrides work via `BC_PAR_*`.
- [ ] **`.dist/` is generated**, git-ignored, and never edited as source.
- [ ] **Tests pass** (`uv run pytest -q`).
