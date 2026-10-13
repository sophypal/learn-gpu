/*
 * Single source of truth for the vertex format: position (float32x3) + color (unorm8x4).
 * Used both when writing vertex data and when describing it to the pipeline.
 */
export const VERTEX_STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 4 * Uint8Array.BYTES_PER_ELEMENT;
export const FLOAT_STRIDE = VERTEX_STRIDE / Float32Array.BYTES_PER_ELEMENT;
export const COLOR_OFFSET = 12;

/**
 * Tells the pipeline how to read one vertex: 16 bytes, position at
 * `@location(0)`, color at `@location(1)`. `unorm8x4` turns four 0-255 bytes
 * into a `vec4f` from 0.0 to 1.0, so the shader gets floats without us
 * converting anything.
 */
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

/* Two triangles sharing the 0-2 diagonal. Counter-clockwise, so back-face culling keeps them. */
const QUAD_INDICES = [0, 1, 2, 0, 2, 3];
/* Vertices per quad. The second quad starts at vertex 4, which is its baseVertex. */
export const QUAD_VERTEX_COUNT = 4;
const VERTEX_COUNT = 2 * QUAD_VERTEX_COUNT;

/**
 * Creates the vertex and index buffers for two overlapping quads at different depths.
 *
 * We fill both buffers with `mappedAtCreation`: the buffer starts out mapped,
 * we write into `getMappedRange()`, and `unmap()` hands it over to the GPU.
 * That doesn't need `COPY_DST`.
 *
 * Position and color share one buffer, so we look at the same bytes two ways:
 * as floats for the position, as bytes for the color.
 *
 * Both quads share one index list. The second one is drawn with `baseVertex`
 * set to 4, so index 0 means vertex 4.
 *
 * @param device - The GPU device.
 * @returns The vertex buffer, the `uint16` index buffer, and the index count.
 *
 * @example
 * ```ts
 * const { geometryBuffer, indexBuffer, indexCount } = createQuads(device);
 * pass.setVertexBuffer(0, geometryBuffer);
 * pass.setIndexBuffer(indexBuffer, 'uint16');
 * pass.drawIndexed(indexCount, 1, 0, 0);                 // first quad
 * pass.drawIndexed(indexCount, 1, 0, QUAD_VERTEX_COUNT); // second quad
 * ```
 */
export function createQuads(device: GPUDevice) {
  const geometryBuffer = device.createBuffer({
    label: 'quad vertex buffer',
    size: VERTEX_STRIDE * VERTEX_COUNT,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  });

  const indexBuffer = device.createBuffer({
    label: 'quad index buffer',
    size: QUAD_INDICES.length * Uint16Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true
  });

  /* Two views of the same bytes. Typed-array offsets count elements, not bytes. */
  const vertices = geometryBuffer.getMappedRange();
  const f32 = new Float32Array(vertices);
  const u8 = new Uint8Array(vertices);

  /**
   * A random color channel from 0 to 255.
   *
   * @example
   * ```ts
   * u8.set([randomColor(), randomColor(), randomColor(), 255], offset);
   * ```
   */
  function randomColor () {
    return Math.floor(Math.random() * 256);
  }

  /**
   * Writes one vertex: position as floats, a random opaque color as bytes.
   *
   * @param index - Which vertex. Its byte offset is `index * VERTEX_STRIDE`.
   *
   * @example
   * ```ts
   * setVertex(0, -0.5, -0.5, 0.0); // bottom-left corner
   * ```
   */
  function setVertex (index: number, x: number, y: number, z: number) {
    f32.set([x, y, z], index * FLOAT_STRIDE);
    u8.set([randomColor(), randomColor(), randomColor(), 255], index * VERTEX_STRIDE + COLOR_OFFSET);
  }

  /* Near quad, at z = 0. */
  setVertex(0, -0.75, -0.5, 0.0);
  setVertex(1, 0.25, -0.5, 0.0);
  setVertex(2, 0.25, 0.5, 0.0);
  setVertex(3, -0.75, 0.5, 0.0);

  /* Far quad, 2 units back, shifted right and up so the two overlap. */
  setVertex(4, -0.25, -0.25, -2.0);
  setVertex(5, 0.75, -0.25, -2.0);
  setVertex(6, 0.75, 0.75, -2.0);
  setVertex(7, -0.25, 0.75, -2.0);

  geometryBuffer.unmap();

  new Uint16Array(indexBuffer.getMappedRange()).set(QUAD_INDICES);

  indexBuffer.unmap();

  return { geometryBuffer, indexBuffer, indexCount: QUAD_INDICES.length };
}
