# Stage 4: Two objects and depth

Tag: `stage-4-depth` · Source: exact

## Concepts
- Two quads in one buffer: `drawIndexed(6, 1, 0, 4)`, where `baseVertex` selects vertices 4–7
- Vertex address = `byteOffset + (firstVertex + i) × arrayStride + attribute.offset`
- Depth must match in three places: texture (created once, never uploaded), pipeline `depthStencil`, pass `depthStencilAttachment`
- `depth24plus`: at least 24 bits, storage chosen by the GPU, not readable on the CPU
- Canvas texture swaps every frame; you own the depth texture

## Mistakes → rules
- Only one quad visible: the second quad was written to slots 0–3; slot index = vertex index
- Depth "worked" without a depth buffer: the quads only touched, and draw order matters only where pixels overlap
