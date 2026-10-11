# Roadmap

One new concept per stage. Each stage is motivated by a limit the previous one exposes.

| Stage | Concept | Limit it answers |
|---|---|---|
| 7 | Frame loop, moving camera, many instances | Nothing can leave the view yet |
| 8 | CPU frustum culling: pack visible instances, `instanceCount = visible` | Drawing what's off-screen |
| 9 | Per-object data in a storage buffer: `objects[instance_index]`, `firstInstance` as object ID | Instancing only works for one mesh; 16-attribute cap; compute can't write vertex attributes |
| 10 | Indirect draw filled from the CPU: `drawIndexedIndirect` | Draw parameters must come from the CPU |
| 11 | First compute shader (animate positions) | No GPU-side work yet |
| 12 | GPU culling: compute + `atomicAdd` + visible index list | CPU culling cost at scale |

Later: textures and samplers (per-material bind groups, sorted draws), MSAA, lighting.
