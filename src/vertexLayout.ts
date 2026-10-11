// Single source of truth for the vertex format: position (float32x3) + color (unorm8x4).
// Used both when writing vertex data and when describing it to the pipeline.
export const VERTEX_STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 4 * Uint8Array.BYTES_PER_ELEMENT;
export const FLOAT_STRIDE = VERTEX_STRIDE / Float32Array.BYTES_PER_ELEMENT;
export const COLOR_OFFSET = 12;

export const meshLayout: GPUVertexBufferLayout = {
  arrayStride: VERTEX_STRIDE,
  stepMode: 'vertex',
  attributes: [
    {
      shaderLocation: 0, offset: 0, format: 'float32x3'
    },
    {
      shaderLocation: 1, offset: COLOR_OFFSET, format: 'unorm8x4'
    }
  ]
};

export const MODEL_STRIDE = 4 * Float32Array.BYTES_PER_ELEMENT * 4;

export const modelLayout: GPUVertexBufferLayout = {
  arrayStride: MODEL_STRIDE ,
  stepMode: 'instance',
  attributes: [
    {
      shaderLocation: 2, offset: 0, format: 'float32x4',
    },
    {
      shaderLocation: 3, offset: 16, format: 'float32x4',
    },
    {
      shaderLocation: 4, offset: 32, format: 'float32x4',
    },
    {
      shaderLocation: 5, offset: 48, format: 'float32x4'
    }
  ]
}