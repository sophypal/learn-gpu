# Current scope

Updated: 2026-10-11 · Last tag: `stage-6-instancing`

## State

10,000 instanced quads at random positions in a 100-unit volume, drawn every frame by a `requestAnimationFrame` loop. The model matrix is per-instance data on vertex slot 1 (locations 2–5). `DrawPacket.execute(pass)` records its own draw. Camera at z = 10, far plane 1000. Last commit: `60d4a47` (not tagged).

## Now: stage 7, frame loop and many objects

Goal: objects that can leave the view, which culling needs.

- [x] `requestAnimationFrame` loop (`60d4a47`)
- [ ] Per frame: rebuild the view matrix and `writeBuffer` it (the camera is still static)
- [ ] A camera that moves or rotates.
- [x] Many instanced quads (10,000, random rather than a grid), with the instance buffer sized from the count

## Open threads

- Explicit bind group layouts (0 = per frame, 1 = per material, 2 = per object)
- Resize handling and `devicePixelRatio` (the depth texture and projection must follow)
- `getCompilationInfo()` after each `createShaderModule`
- Verify that reconstructed tags 1–3 actually render (base for the tutorial series)
