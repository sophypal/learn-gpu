# Stage 7: Frame loop, many instances, indirect draw

Tag: `stage-7-indirect` · Source: real

## Concepts
- Mesh attributes (locations 0–1) and instance attributes (2–5) are separate vertex input structs, mirroring the two buffer slots
- `requestAnimationFrame` drives `drawFrame`; `DrawPacket.execute(pass)` records its own draw
- 10,000 instances at random positions; the instance buffer is sized from the count
- `drawIndexedIndirect(buffer, offset)` reads 5 × u32 (20 bytes): `indexCount, instanceCount, firstIndex, baseVertex, firstInstance`; `drawIndirect` reads 4 (no `firstIndex`)
- The argument buffer needs `INDIRECT` (+ `COPY_DST` to fill it); usage flags list every role a buffer will play
- Nonzero `firstInstance` needs the `indirect-first-instance` feature, otherwise the draw is skipped
- CPU-filled indirect looks identical on screen; the payoff is the GPU writing the arguments (compute culling, `STORAGE | INDIRECT`)
- Toward GPU-driven: one slab of draw arguments read at per-draw offsets, and a geometry slab addressed by `firstIndex`/`baseVertex`. Core WebGPU has no multi-draw indirect, so it's still one call per draw

## Mistakes → rules
- Arguments written with `writeBuffer` every frame, after `drawIndexedIndirect` was recorded; it worked: `writeBuffer` is ordered against `submit`, not against encoder commands. Data known at creation is written at creation
