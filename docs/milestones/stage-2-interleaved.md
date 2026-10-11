# Stage 2: Interleaved vertex data

Tag: `stage-2-interleaved` · Source: reconstructed

## Concepts
- 16-byte vertex: `float32x3` position (12) + `unorm8x4` color (4)
- Two typed-array views over one `ArrayBuffer`: `Float32Array` indexes in floats, `Uint8Array` in bytes
- `unorm8x4`: bytes 0–255 arrive in the shader as `vec4f` in 0–1. The GPU converts on read; you convert on upload
- Alignment: attribute offset must be a multiple of min(4, format size); `arrayStride` a multiple of 4
- `pack4x8unorm` / `unpack4x8unorm` for storage buffers (no 8-bit types there)
- Index buffer: `setIndexBuffer(buffer, 'uint16' | 'uint32')`

## Mistakes → rules
- `RangeError` on `f32.set`: typed-array offsets count elements, not bytes
- Same `RangeError`: buffer still sized for 2D positions, so size = stride × count
- Whole quad medium blue: pipeline layout not updated; −1.0 = `00 00 80 BF` read as color gives blue 0.5
