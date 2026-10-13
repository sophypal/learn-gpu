# Current scope

Updated: 2026-10-12 · Last tag: `stage-8-gpu-culling`

## State

10,000 quads. Each frame: `clearBuffer` zeroes `instanceCount`, a compute pass culls each object's origin in clip space and appends visible indices with `atomicAdd`, then `drawIndexedIndirect` draws `model[visibleList[instance_index]]`. Explicit layouts: groups 0 (frame) and 1 (entity) shared, group 2 per pipeline. `CULL_SCALE` override shrinks the cull bound for testing. Camera static at z = 10.

## Now: stage 9, moving camera (proposed)

Goal: see culling work as objects leave the view.

- [ ] Per frame: rebuild the view matrix and `writeBuffer` it
- [ ] A camera that moves or rotates

## Tutorial rebuild

`stage-8-reference` is the cleaned, documented final version. The tutorial is built backwards from it: one stage at a time, checked for (1) it runs, (2) pacing and transitions, (3) content coverage without looking too polished. Learners follow with two worktrees: their own, and a reference checked out at the next step (whole files, no diffs). Commits carry journal notes and pitfalls; a broken commit only when the trap is planned. Pilot draft of stage 8 steps: branch `tutorial/stage-8` (worktree `../learn-gpu-tutorial`), built forward before the cleanup, so it needs redoing.

## Open threads

- Who owns a shared draw-argument slab once there's more than one packet (see roadmap, "Discussed")
- Resize handling and `devicePixelRatio` (the depth texture and projection must follow)
- `getCompilationInfo()` after each `createShaderModule`
- Verify that reconstructed tags 1–3 actually render (base for the tutorial series)
