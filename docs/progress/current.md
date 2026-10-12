# Current scope

Updated: 2026-10-12 · Last tag: `stage-7-indirect`

## State

10,000 instanced quads drawn every frame with `drawIndexedIndirect`. The model matrices now live in a storage buffer (`var<storage> model: array<mat4x4f>`) read as `model[instance_index]`; the instance vertex buffer and its layout are gone. Camera static at z = 10.

## Now: stage 8, GPU culling

The moving camera was skipped; culling comes first. Compute scaffolding (`src/compute.ts`, `src/shaders/cull.wesl`) exists but isn't wired in (`main.ts` has it commented out).

- [x] Object table in a storage buffer, indexed by `instance_index`
- [x] Explicit bind group layouts: 0 frame (shared), 1 entity (shared), 2 visibility (`storage` in compute, `read-only-storage` in vertex); `render-state.ts` owns shared buffers and groups
- [x] Labels on every GPU object (`group N: <name>`, `<what> buffer`, file name for shader modules)
- [ ] Cull shader body, with a bounds check via `arrayLength`
- [ ] `instanceCount` as `atomic<u32>`; reset only that field (offset 4, 4 bytes) before the cull pass
- [ ] `visibleBuffer` sized in bytes (`instances * 4`); dispatch rounded up (`Math.ceil(instances / 64)`)
- [ ] Vertex shader reads `model[visible[instance_index]]`
- [ ] Wire the compute pass into `drawFrame` before the render pass

## Mistakes → rules (for the stage 8 milestone)

- Explicit layouts (labels made each visible):
  - Order: a layout's position in `bindGroupLayouts` is its group index; lookup tables like `GroupOrder` don't affect it
  - Visibility: `visibility` must include every stage that uses the entry; writable `'storage'` can't include `VERTEX`
  - Types: layout `type` must match the shader's address space and access mode; fix the wrong side, don't add usage flags to silence it
  - Usages: a buffer's usage flags must cover every way it's bound or used
- Debugging: label every GPU object; in an error cascade only the first message is the cause
- `'auto'` layout dropped every binding the empty cull body didn't use: `'auto'` reflects use, not declaration

## Open threads

- Moving camera (skipped; needed to see culling actually cull)
- Who owns a shared draw-argument slab once there's more than one packet (see roadmap, "Discussed")
- Resize handling and `devicePixelRatio` (the depth texture and projection must follow)
- `getCompilationInfo()` after each `createShaderModule`
- Verify that reconstructed tags 1–3 actually render (base for the tutorial series)
