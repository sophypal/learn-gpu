# Stage 3: Perspective and camera

Tag: `stage-3-camera` · Source: reconstructed

## Concepts
- `@group(g) @binding(b) var<uniform>`; `setBindGroup(g)` fills a whole group, `entries[].binding` each slot
- Pipeline layout → bind group layouts → bind groups
- Camera looks down −z; z first hardcoded in the shader, then moved into vertex data
- 4×4 because 3×3 can't translate (affine); `mat3x3f` is 48 bytes with column padding
- `projection × view` combined on the CPU, one `writeBuffer` of 64 bytes
- `lookAt` = view matrix; `cameraAim` = camera world matrix (its inverse)

## Mistakes → rules
- `createBindGroup` error with a 48-byte buffer: the buffer must be ≥ the shader type's size (`mat4x4f` = 64)
