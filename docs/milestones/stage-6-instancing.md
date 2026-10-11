# Stage 6: Draw packets and instancing

Tag: `stage-6-instancing` · Source: real (commits begin here)

## Concepts
- `DrawPacket` groups pipeline, vertex buffers, index buffer and bind groups for one kind of draw
- Instance data lives in its own buffer on slot 1 (`stepMode: 'instance'`), not in the geometry
- A `mat4` = four `float32x4` attributes (offsets 0/16/32/48), reassembled in the shader
- `@location` numbers are global across buffers and must match `shaderLocation` exactly
- Every (vertex, instance) pair runs once, in parallel, in no guaranteed order
- `writeBuffer` isn't recorded in the encoder: all writes land before the submitted commands run
- Per-object alternatives: bind groups (fixed offsets aligned to 256, or dynamic offsets with an explicit layout), storage buffers

## Mistakes → rules
- "Missing entry point IO" on `modelMatrix2`: `@locatoin(4)` typo; any `@name(...)` parses
- Instance data overwrote the mesh: `setVertexBuffer(0, …)` in a loop; the slot must match the layout order
