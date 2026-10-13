# Current scope

Updated: 2026-10-12 · Last tag: `stage-8-gpu-culling`

## State

10,000 quads. Each frame: `clearBuffer` zeroes `instanceCount`, a compute pass culls each object's origin in clip space and appends visible indices with `atomicAdd`, then `drawIndexedIndirect` draws `model[visibleList[instance_index]]`. Explicit layouts: groups 0 (frame) and 1 (entity) shared, group 2 per pipeline. `CULL_SCALE` override shrinks the cull bound for testing. Camera static at z = 10.

## Now: stage 9, moving camera (proposed)

Goal: see culling work as objects leave the view.

- [ ] Per frame: rebuild the view matrix and `writeBuffer` it
- [ ] A camera that moves or rotates

## Open threads

- Leftovers: `STORAGE` usage on the camera buffer; unused `vertexLayout.ts`; `visibleBuffer` sized with `MAT4_SIZE_IN_BYTES` (needs 4 bytes per entry)
- Who owns a shared draw-argument slab once there's more than one packet (see roadmap, "Discussed")
- Resize handling and `devicePixelRatio` (the depth texture and projection must follow)
- `getCompilationInfo()` after each `createShaderModule`
- Verify that reconstructed tags 1–3 actually render (base for the tutorial series)
