import { COLOR_OFFSET, FLOAT_STRIDE, VERTEX_STRIDE } from './vertexLayout';

const VERTEX_COUNT = 8;

export function createQuads(device: GPUDevice) {
  const vertexBuffer = device.createBuffer({
    size: VERTEX_STRIDE * VERTEX_COUNT,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const indexBuffer = device.createBuffer({
    size: 6 * Uint16Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const vertices = vertexBuffer.getMappedRange();
  const f32 = new Float32Array(vertices);
  const u8 = new Uint8Array(vertices);

  function setVertex (index: number, x: number, y: number, z: number, r: number, g: number, b: number, a: number) {
    f32.set([x, y, z], index * FLOAT_STRIDE);
    u8.set([r, g, b, a], index * VERTEX_STRIDE + COLOR_OFFSET);
  }

  setVertex(0, -0.75, -0.5, -1.0, 255, 0, 0, 255);
  setVertex(1, 0.25, -0.5, -1.0, 0, 255, 0, 255);
  setVertex(2, 0.25, 0.5, -1.0, 0, 0, 255, 255);
  setVertex(3, -0.75, 0.5, -1.0, 0, 255, 0, 255);

  setVertex(4, -0.25, -0.5, -2.0, 255, 0, 0, 255);
  setVertex(5, 0.75, -0.5, -2.0, 0, 255, 0, 255);
  setVertex(6, 0.75, 0.5, -2.0, 0, 0, 255, 255);
  setVertex(7, -0.25, 0.5, -2.0, 0, 255, 0, 255);

  vertexBuffer.unmap();

  new Uint16Array(indexBuffer.getMappedRange()).set([0, 1, 2, 0, 2, 3]);

  indexBuffer.unmap();

  return { vertexBuffer, indexBuffer };
}
