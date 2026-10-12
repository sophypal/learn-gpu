# Current scope

Updated: 2026-10-11 · Last tag: `stage-7-indirect`

## State

10,000 instanced quads at random positions in a 100-unit volume, drawn every frame by a `requestAnimationFrame` loop with `drawIndexedIndirect`. The 20-byte argument buffer is written once in `createDrawPacket`. The model matrix is per-instance data on vertex slot 1 (locations 2–5). Camera at z = 10, far plane 1000, static.

## Now: stage 8, moving camera

Goal: objects that can leave the view, which culling needs.

- [ ] Per frame: rebuild the view matrix and `writeBuffer` it
- [ ] A camera that moves or rotates

## Open threads

- Who owns a shared draw-argument slab once there's more than one packet (see roadmap, "Discussed")
- Explicit bind group layouts (0 = per frame, 1 = per material, 2 = per object)
- Resize handling and `devicePixelRatio` (the depth texture and projection must follow)
- `getCompilationInfo()` after each `createShaderModule`
- Verify that reconstructed tags 1–3 actually render (base for the tutorial series)
