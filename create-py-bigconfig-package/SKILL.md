---
name: create-py-bigconfig-package
description: Scaffold a new minimal, launcher-conformant Python BigConfig package from bundled templates. Use when asked to create, bootstrap, or scaffold a new BigConfig package in Python — one that depends on the big-config SDK, exposes validate/build verbs, and runs via the bc-pkg launcher.
---

# Create a Python BigConfig package

This skill scaffolds a new, minimal **Python BigConfig package** from the bundled
templates in `templates/`. The result is the smallest thing that is a real package:
it depends only on the `big-config` SDK, renders one template through a single `hello`
stage, exposes `validate` + `build` verbs, ships a launcher-friendly root `run`, and
tests green. The author then grows it (more params, more stages).

It is the Python twin of `create-ts-bigconfig-package`; keep the three language skills
behaviourally consistent. Read `reference/checklist.md` for the conformance contract.
The authoritative spec is `once-bigconfig/main/src/pages/package-spec.html`.

## Step 1 — Collect inputs

Ask the user (offer the defaults; don't block on obvious answers):

| Input | Meaning | Default |
|---|---|---|
| package name | PyPI / CLI name (lowercase; hyphens allowed) | required |
| GitHub owner | owner used to build the reverse-DNS namespace | `bigconfig-ai` |
| description | one-line `pyproject.toml` description | `A minimal BigConfig package.` |
| target directory | where to create the package | `<name>/python` as a workspace sibling |
| SDK source | how to depend on `big-config` | GitHub SHA pin (see Step 2) |

## Step 2 — Derive the substitution tokens

Compute these once; every `.tmpl` file is filled by replacing them literally.

| Token | Derivation | Example (name `widget`, owner `bigconfig-ai`) |
|---|---|---|
| `__PKG_NAME__` | the package name verbatim (PyPI name, CLI, dist) | `widget` |
| `__PKG_MODULE__` | importable module name (snake_case; hyphens → `_`) | `widget` (`my-widget` → `my_widget`) |
| `__PKG_OWNER__` | the GitHub owner | `bigconfig-ai` |
| `__PKG_NAMESPACE__` | `io.github.<owner>.<name>` (engine step names) | `io.github.bigconfig-ai.widget` |
| `__PKG_NS_PATH__` | the namespace as a path, hyphens kept (resources) | `io/github/bigconfig-ai/widget` |
| `__PKG_DESC__` | the description | `A minimal BigConfig package.` |
| `__BIG_CONFIG_REF__` | the `big-config` dependency string | `big-config @ git+https://github.com/bigconfig-ai/big-config.git@<sha>` |

`__PKG_MODULE__` is the load-bearing extra vs the package name: it is the `src/<module>/`
directory, the `[project.scripts]` and `packages = ["src/<module>"]` targets, every
intra-package import, and the names of the package entry functions (`<module>` and
`<module>_star`). A hyphenated package name **must** become an underscored module
(`my-widget` → `my_widget`), or imports break.

For `__BIG_CONFIG_REF__`:
- **Default (publishable):** a GitHub SHA pin. Read the current SHA from a sibling leaf —
  `grep -o 'big-config.git@[0-9a-f]*' once/python/pyproject.toml` — and use
  `big-config @ git+https://github.com/bigconfig-ai/big-config.git@<sha>`.
- **Local SDK dev:** keep `dependencies = ["big-config"]` and add
  `[tool.uv.sources]` with `big-config = { path = "../../big-config/python", editable = true }`
  (relative path depends on where you create the package).

## Step 3 — Copy templates into the target directory

Create the target dir, then copy `templates/` into it with these renames:

- `templates/gitignore`             → `.gitignore`
- `templates/pyproject.toml.tmpl`   → `pyproject.toml`
- `templates/run.tmpl`              → `run`  (then `chmod +x run`)
- `templates/README.md.tmpl`        → `README.md`
- `templates/src/pkg/`              → `src/<PKG_MODULE>/`  (rename the `pkg` dir; the
  files `interop.py`, `params.py`, `validation.py`, `__init__.py`, `__main__.py`,
  `py.typed` are verbatim, the `*.tmpl` files are filled, dropping the `.tmpl` suffix)
- `templates/src/resources/tools/`  → `src/resources/<PKG_NS_PATH>/tools/`  (relocate
  under the namespace path; `greeting.txt` is verbatim)
- `templates/tests/*.tmpl`          → `tests/*` (drop `.tmpl`)

Files that contain tokens (`*.tmpl`): `pyproject.toml`, `run`, `README.md`, `cli.py`,
`src/<module>/options.py`, `src/<module>/tools.py`, `src/<module>/package.py`,
`tests/test_build.py`, `tests/test_validation.py`. Files with **no** tokens (copy
verbatim): `__init__.py`, `__main__.py`, `py.typed`, `interop.py`, `params.py`,
`validation.py`, `greeting.txt`, `gitignore`.

## Step 4 — Substitute tokens

Replace every token in the copied files with the Step 2 values. Be exact — these are
load-bearing: `__PKG_MODULE__` must be a valid Python identifier (it becomes the
`src/<module>/` dir, the entry functions `<module>` / `<module>_star`, and every import),
while `__PKG_NAMESPACE__` produces the workflow step names and must match the
`__PKG_NS_PATH__` you used to relocate the resource directory (otherwise the renderer
won't find the template at runtime).

## Step 5 — Sync, test, run

In the target directory:

```bash
uv sync
uv run pytest -q
uv run python run package validate          # expect: All checks passed. (exit 0)
uv run python run package build             # expect: renders .dist/<name>-<hash>/.../hello/greeting.txt
BC_PAR_NAME=REPLACE_ME uv run python run package validate   # expect: validation failed (exit 1)
```

All of these must succeed (the override case must *fail* validation — that proves
`BC_PAR_*` overrides reach the report). Confirm `.dist/` exists, holds the rendered
`greeting.txt` containing `Hello, world!`, and is git-ignored.

## Step 6 — Report

Print `reference/checklist.md` with each item confirmed, then tell the user how to grow
the package (edit the profile in `options.py` + `run`, add stages in `tools.py` and the
pipeline in `package.py`, override params with `BC_PAR_*`) and how to make it
`bc-pkg`-installable: push to GitHub and run
`uvx bc-pkg <owner>/<name>@<ref> package build`, or for local dev
`uvx bc-pkg ../<name>/python package build`.

## Notes

- Boundary keys (profile/template params) stay kebab-case strings matching template
  variable names (`package`, `name`) — not snake_case.
- The launcher runtime command for a Python target is `uv run python run …`.
- Never write real credentials; placeholders only.
- `.dist/` is generated output — never edit it as source.
- This skill lives in its own directory inside the `skills/` repository. To make it an
  auto-discovered slash command, place or symlink this `create-py-bigconfig-package/`
  directory under `.claude/skills/`.
