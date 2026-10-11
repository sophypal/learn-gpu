# Architecture

As of `stage-6-instancing`.

| File | Role |
|---|---|
| `src/main.ts` | Canvas sizing; wires the steps together |
| `src/gpu.ts` | `initGPU`: adapter, device, context, format |
| `src/vertexLayout.ts` | The single definition of vertex formats: `meshLayout` (slot 0), `modelLayout` (slot 1, per instance) |
| `src/geometry.ts` | Quad mesh: vertex + index buffers |
| `src/camera.ts` | Projection × view → 64-byte uniform |
| `src/pipeline.ts` | Shader modules, render pipeline, camera bind group, `DEPTH_FORMAT` |
| `src/draw-packet.ts` | `DrawPacket`: pipeline + vertex buffers + index buffer + bind groups for one kind of draw |
| `src/render.ts` | Depth texture, `drawFrame` |
| `src/shaders/` | `vert.wesl`, `frag.wesl`, `types.wesl` (shared `VertexOutput`) |

Data split by update rate: geometry (slot 0), per-object (slot 1, instance), per-frame (group 0 uniform).
