# BigConfig skills

A collection of [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills)
for working in the BigConfig workspace. Each skill is a self-contained directory holding
a `SKILL.md` plus any supporting templates and reference material.

## Skills

| Skill | What it does |
|---|---|
| [`create-ts-bigconfig-package`](create-ts-bigconfig-package/SKILL.md) | Scaffold a new minimal, launcher-conformant TypeScript BigConfig package from bundled templates. |
| [`create-py-bigconfig-package`](create-py-bigconfig-package/SKILL.md) | Scaffold a new minimal, launcher-conformant Python BigConfig package from bundled templates. |
| [`create-clj-bigconfig-package`](create-clj-bigconfig-package/SKILL.md) | Scaffold a new minimal, launcher-conformant Clojure BigConfig package from bundled templates. |

## Repository layout

```
skills/                                 # this repository
├── README.md                           # this index
└── <skill-name>/                       # one directory per skill (named after the skill)
    ├── SKILL.md                        # frontmatter (name, description) + the procedure
    ├── reference/                      # optional: checklists, specs, supporting docs
    └── templates/                      # optional: files the skill copies/customizes
```

The directory name matches the skill's `name:` in its `SKILL.md` frontmatter. Paths
referenced inside a `SKILL.md` (e.g. `templates/...`, `reference/...`) are relative to
that skill's own directory.

## Using a skill

These skills are not auto-discovered from this repository on their own. To make a skill
available as a `/<name>` slash command in Claude Code, place or symlink its directory
under a discovered skills location — for example:

```sh
ln -s "$PWD/create-ts-bigconfig-package" ~/.claude/skills/create-ts-bigconfig-package
# or, per-project:
ln -s "$PWD/create-ts-bigconfig-package" /path/to/project/.claude/skills/create-ts-bigconfig-package
```

## Adding a skill

1. Create a new directory named after the skill (kebab-case).
2. Add a `SKILL.md` with `name:` and `description:` frontmatter and the procedure.
3. Put any bundled files under `templates/` and any docs under `reference/`.
4. Add a row to the **Skills** table above.
