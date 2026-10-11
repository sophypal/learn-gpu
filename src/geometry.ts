import { COLOR_OFFSET, FLOAT_STRIDE, VERTEX_STRIDE } from './vertexLayout';

const VERTEX_COUNT = 8;

export function createQuads(device: GPUDevice) {
  const geometryBuffer = device.createBuffer({
    size: VERTEX_STRIDE * VERTEX_COUNT,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const indexBuffer = device.createBuffer({
    size: 6 * Uint16Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const vertices = geometryBuffer.getMappedRange();
  const f32 = new Float32Array(vertices);
  const u8 = new Uint8Array(vertices);

  function randomColor () {
    return Math.floor(Math.random() * 255);
  }

  function setVertex (index: number, x: number, y: number, z: number) {
    f32.set([x, y, z], index * FLOAT_STRIDE);
    u8.set([randomColor(), randomColor(), randomColor(), randomColor()], index * VERTEX_STRIDE + COLOR_OFFSET);
  }

  setVertex(0, -0.5, -0.5, 0.0);
  setVertex(1, 0.5, -0.5, 0.0);
  setVertex(2, 0.5, 0.5, 0.0);
  setVertex(3, -0.5, 0.5, 0.0);

  geometryBuffer.unmap();

  new Uint16Array(indexBuffer.getMappedRange()).set([0, 1, 2, 0, 2, 3]);

  indexBuffer.unmap();

  return { geometryBuffer, indexBuffer };
}
