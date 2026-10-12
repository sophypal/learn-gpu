# Current scope

Updated: 2026-10-11 · Last tag: `stage-7-indirect`

## State

10,000 instanced quads drawn every frame with `drawIndexedIndirect`. The model matrices now live in a storage buffer (`var<storage> model: array<mat4x4f>`) read as `model[instance_index]`; the instance vertex buffer and its layout are gone. Camera static at z = 10.

## Now: stage 8, GPU culling

The moving camera was skipped; culling comes first. Compute scaffolding (`src/compute.ts`, `src/shaders/cull.wesl`) exists but isn't wired in (`main.ts` has it commented out).

- [x] Object table in a storage buffer, indexed by `instance_index`
- [ ] Cull shader: `@group` (not `@global`), `@workgroup_size`, bounds check with `arrayLength`
- [ ] `'auto'` layout keeps only bindings the entry point uses: the body must touch all three
- [ ] `instanceCount` as `atomic<u32>`; reset only that field (offset 4, 4 bytes) before the cull pass
- [ ] `visibleBuffer` sized in bytes (`instances * 4`); dispatch rounded up (`Math.ceil(instances / 64)`)
- [ ] Indirect buffer gains `STORAGE`
- [ ] Vertex shader reads `model[visible[instance_index]]`
- [ ] Wire the compute pass into `drawFrame` before the render pass

## Open threads

- Moving camera (skipped; needed to see culling actually cull)
- Who owns a shared draw-argument slab once there's more than one packet (see roadmap, "Discussed")
- Explicit bind group layouts (0 = per frame, 1 = per material, 2 = per object)
- Resize handling and `devicePixelRatio` (the depth texture and projection must follow)
- `getCompilationInfo()` after each `createShaderModule`
- Verify that reconstructed tags 1–3 actually render (base for the tutorial series)
