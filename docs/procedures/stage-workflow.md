# Stage workflow

How a stage goes from idea to milestone.

1. **Scope it.** Put the stage's goal and checklist in `docs/progress/current.md`. One new concept only.
2. **Build in small steps.** The user drives. Claude explains, or nudges when asked; it doesn't write the stage's code unless asked.
3. **Collect mistakes.** Each bug that taught a rule gets a line in the milestone file (symptom → rule).
4. **Close it** (commit only when the user asks):
   - Commit, then tag `stage-N-<slug>`.
   - Add `docs/milestones/stage-N-<slug>.md` (template below) and a row in `docs/milestones/README.md`.
   - Add the stage to the Journey doc: concepts, mistakes table, roadmap.
   - Move the next stage into `current.md`; update `roadmap.md`.

## Milestone file template

```md
# Stage N: <title>

Tag: `stage-N-<slug>` · Source: real | reconstructed | exact

## Concepts
- ...

## Mistakes → rules
- <symptom>: <rule>
```
