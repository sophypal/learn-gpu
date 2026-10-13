# Roadmap

One new concept per stage. Each stage is motivated by a limit the previous one exposes.

| Stage | Concept | Limit it answers |
|---|---|---|
| 7 ✓ | Frame loop, many instances, indirect draw filled from the CPU | Draw parameters must come from the CPU |
| 8 ✓ | Storage buffers, explicit bind group layouts, GPU culling (compute + `atomicAdd` + visible list, clip-space point test) | Drawing what's off-screen; per-object data limited to vertex attributes |
| 9 | Moving camera: per-frame view matrix | Culling can't be seen while nothing leaves the view |
| 10 | GPU readback through a ring of staging buffers | The visible count can't be inspected from the CPU |

Exercises: bounding sphere against frustum planes (stops edge popping); two-level counting with workgroup memory and barriers (one global atomic per workgroup).

Skipped: CPU frustum culling (went straight to GPU culling).

Later: textures and samplers (per-material bind groups, sorted draws), MSAA, lighting.

Discussed, not scheduled: one slab of draw arguments shared by all packets (per-draw offsets) and a shared geometry slab (`firstIndex`/`baseVertex`), owned by a renderer that hands out shared state; a render-state cache for pipelines, materials and uniforms. Probably beyond the tutorial's scope.
