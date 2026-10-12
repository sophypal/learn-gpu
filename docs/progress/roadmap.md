# Roadmap

One new concept per stage. Each stage is motivated by a limit the previous one exposes.

| Stage | Concept | Limit it answers |
|---|---|---|
| 7 ✓ | Frame loop, many instances, indirect draw filled from the CPU | Draw parameters must come from the CPU |
| 8 | Moving camera: per-frame view matrix | Nothing can leave the view yet |
| 9 | CPU frustum culling: pack visible instances, write `instanceCount = visible` into the indirect buffer | Drawing what's off-screen |
| 10 | Per-object data in a storage buffer: `objects[instance_index]`, `firstInstance` as object ID | Instancing only works for one mesh; 16-attribute cap; compute can't write vertex attributes |
| 11 | First compute shader (animate positions) | No GPU-side work yet |
| 12 | GPU culling: compute + `atomicAdd` + visible index list, writing the indirect buffer | CPU culling cost at scale |

Later: textures and samplers (per-material bind groups, sorted draws), MSAA, lighting.

Discussed, not scheduled: one slab of draw arguments shared by all packets (per-draw offsets) and a shared geometry slab (`firstIndex`/`baseVertex`), owned by a renderer that hands out shared state; a render-state cache for pipelines, materials and uniforms. Probably beyond the tutorial's scope.
