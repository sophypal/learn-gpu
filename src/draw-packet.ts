import { mat4 } from 'wgpu-matrix';
import { DEPTH_FORMAT } from './render';
import { meshLayout, createQuads } from './geometry';
import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';

const MAT4_SIZE_IN_BYTES = 64;
const EXTENTS = 100;

/**
 * Tells the pipeline how to read one instance's model matrix from vertex
 * buffer slot 1: four `float32x4` columns at locations 2-5.
 *
 * `stepMode: 'instance'` means the buffer advances once per instance instead
 * of once per vertex, so all four corners of a quad get the same matrix.
 */
const modelLayout: GPUVertexBufferLayout = {
  arrayStride: MAT4_SIZE_IN_BYTES,
  stepMode: 'instance',
  attributes: [
    { shaderLocation: 2, offset: 0, format: 'float32x4' },
    { shaderLocation: 3, offset: 16, format: 'float32x4' },
    { shaderLocation: 4, offset: 32, format: 'float32x4' },
    { shaderLocation: 5, offset: 48, format: 'float32x4' }
  ]
};

/**
 * A random number from `low` up to (not including) `high`.
 *
 * @example
 * ```ts
 * getRandom(50, -50); // somewhere between -50 and 50
 * ```
 */
function getRandom (high: number, low: number = 0) {
  const range = high - low;
  return Math.random() * range + low;
}

/**
 * Creates the per-instance buffer: one model matrix per quad, scattered
 * randomly through a 100-unit box in front of the camera.
 *
 * @param device - The GPU device.
 * @param instances - How many quads.
 * @returns A vertex buffer of `instances` column-major `mat4x4f`s.
 *
 * @example
 * ```ts
 * const modelBuffer = createModelBuffer(device, 10_000);
 * pass.setVertexBuffer(1, modelBuffer);
 * ```
 */
function createModelBuffer (device: GPUDevice, instances: number) {
  const modelBuffer = device.createBuffer({
    label: 'model buffer',
    size: instances * MAT4_SIZE_IN_BYTES,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  });

  for (let i = 0; i < instances; i++) {
    const x = getRandom(EXTENTS/2, -EXTENTS/2);
    const y = getRandom(EXTENTS/2, -EXTENTS/2);
    const z = getRandom(-EXTENTS);

    mat4.translation([x, y, z], new Float32Array(modelBuffer.getMappedRange(i*MAT4_SIZE_IN_BYTES, MAT4_SIZE_IN_BYTES)));
  }

  modelBuffer.unmap();

  return modelBuffer;
}

/** One kind of draw: its pipeline, plus a function that records the draw into a render pass. */
export interface DrawPacket {
  pipeline: GPURenderPipeline,
  /**
   * Records this draw into an open render pass.
   *
   * @example
   * ```ts
   * drawPacket.execute(renderPass);
   * ```
   */
  execute: (pass: GPURenderPassEncoder) => void
}

/**
 * Creates the pipeline that draws our quads.
 *
 * A pipeline bundles the shaders with everything fixed about how they run:
 * which entry points, what the vertex input looks like (`meshLayout`), the
 * primitive type, and the format of the texture we draw into.
 *
 * @param device - The GPU device.
 * @param format - The canvas format. The color target has to match it.
 * @returns The render pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createRenderPipeline(device, format);
 * renderPass.setPipeline(pipeline);
 * ```
 */
export function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const vertexShaderModule = device.createShaderModule({
    label: 'vert.wesl',
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    label: 'frag.wesl',
    code: fragmentShader
  });

  return device.createRenderPipeline({
    label: 'render pipeline',
    layout: 'auto',
    vertex: {
      module: vertexShaderModule,
      entryPoint: 'vsMain',
      buffers: [meshLayout, modelLayout]
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: 'fsMain',
      targets: [{
        format
      }]
    },
    /* Back faces are skipped; QUAD_INDICES winds the quad counter-clockwise (front-facing). */
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    /* Keep the nearest fragment: pass when its depth is less than what's stored. */
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: true,
      depthCompare: 'less'
    }
  });
}

/**
 * Creates the bind group that hands the camera buffer to the shader at
 * `@group(0) @binding(0)`.
 *
 * The pipeline uses `layout: 'auto'`, so it works out its bind group layouts
 * from the shader. We ask it for group 0's layout and build the bind group
 * from that.
 *
 * @param device - The GPU device.
 * @param pipeline - The render pipeline whose group 0 this fills.
 * @param cameraBuffer - The camera's uniform buffer.
 * @returns The bind group for group 0.
 *
 * @example
 * ```ts
 * const cameraBindGroup = createCameraBindGroup(device, pipeline, cameraBuffer);
 * renderPass.setBindGroup(0, cameraBindGroup);
 * ```
 */
function createCameraBindGroup(device: GPUDevice, pipeline: GPURenderPipeline, cameraBuffer: GPUBuffer) {
  return device.createBindGroup({
    label: 'group 0: camera',
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: cameraBuffer }]
  });
}

/**
 * Creates the draw packet for our quads: everything one kind of draw needs,
 * and a function that records it.
 *
 * `execute` sets the pipeline, the camera bind group, the quad and the
 * per-instance matrices, and draws every quad with one instanced draw.
 *
 * @param device - The GPU device.
 * @param format - The canvas format.
 * @param cameraBuffer - The camera's uniform buffer.
 * @param instances - How many quads to draw.
 * @returns A packet whose `execute` records the draw.
 *
 * @example
 * ```ts
 * const drawPacket = createDrawPacket(device, format, cameraBuffer, 10_000);
 * drawPacket.execute(renderPass);
 * ```
 */
export function createDrawPacket (device: GPUDevice, format: GPUTextureFormat, cameraBuffer: GPUBuffer, instances: number): DrawPacket {
  const pipeline = createRenderPipeline(device, format);
  const cameraBindGroup = createCameraBindGroup(device, pipeline, cameraBuffer);
  const { geometryBuffer, indexBuffer, indexCount } = createQuads(device);
  const modelBuffer = createModelBuffer(device, instances);

  return {
    pipeline,
    execute: (pass: GPURenderPassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, cameraBindGroup);

      pass.setVertexBuffer(0, geometryBuffer);
      pass.setVertexBuffer(1, modelBuffer);
      pass.setIndexBuffer(indexBuffer, 'uint16');
      pass.drawIndexed(indexCount, instances);
    }
  };
}
