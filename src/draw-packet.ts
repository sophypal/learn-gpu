import { mat4 } from 'wgpu-matrix';
import { DEPTH_FORMAT } from './render';
import { meshLayout, createQuads } from './geometry';
import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';

const MAT4_SIZE_IN_BYTES = 64;
const U32_SIZE_IN_BYTES = 4;
const EXTENTS = 100;

/**
 * Size of the indirect draw arguments in bytes. `drawIndexedIndirect` reads
 * five u32s: `indexCount, instanceCount, firstIndex, baseVertex, firstInstance`.
 */
const INDIRECT_ARGS_SIZE = 5 * U32_SIZE_IN_BYTES;

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
 * Creates the object table: one model matrix per object, scattered randomly
 * through a 100-unit box in front of the camera.
 *
 * This has to be a storage buffer. 10,000 matrices at 64 bytes each is 640 KB,
 * and uniform buffers are only guaranteed 64 KB. Storage also lets the shader
 * declare `array<mat4x4f>` without a length; the length comes from the buffer.
 *
 * The vertex shader reads it at `@group(0) @binding(1)`.
 *
 * @param device - The GPU device.
 * @param instances - How many objects.
 * @returns A storage buffer of `instances` column-major `mat4x4f`s.
 *
 * @example
 * ```ts
 * const modelBuffer = createModelBuffer(device, 10_000);
 * // in WGSL, model[i][3].xyz is object i's position (the translation column)
 * ```
 */
function createModelBuffer (device: GPUDevice, instances: number) {
  const modelBuffer = device.createBuffer({
    label: 'model buffer',
    size: instances * MAT4_SIZE_IN_BYTES,
    usage: GPUBufferUsage.STORAGE,
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
      buffers: [meshLayout]
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
 * Creates the bind group for group 0: the camera at binding 0 and the object
 * table at binding 1.
 *
 * The pipeline uses `layout: 'auto'`, so it works out its bind group layouts
 * from the shader. We ask it for group 0's layout and build the bind group
 * from that.
 *
 * @param device - The GPU device.
 * @param pipeline - The render pipeline whose group 0 this fills.
 * @param cameraBuffer - The camera's uniform buffer.
 * @param modelBuffer - The object table.
 * @returns The bind group for group 0.
 *
 * @example
 * ```ts
 * const bindGroup = createRenderBindGroup(device, pipeline, cameraBuffer, modelBuffer);
 * renderPass.setBindGroup(0, bindGroup);
 * ```
 */
function createRenderBindGroup(device: GPUDevice, pipeline: GPURenderPipeline, cameraBuffer: GPUBuffer, modelBuffer: GPUBuffer) {
  return device.createBindGroup({
    label: 'group 0: camera and models',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: cameraBuffer },
      { binding: 1, resource: modelBuffer }
    ]
  });
}

/**
 * Creates the draw packet for our quads: everything one kind of draw needs,
 * and a function that records it.
 *
 * `execute` sets the pipeline, the bind group (camera and object table) and
 * the quad, and draws every quad with one `drawIndexedIndirect`.
 * The draw's arguments live in a GPU buffer, written once here, instead of
 * being passed to the call.
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
  const { geometryBuffer, indexBuffer, indexCount } = createQuads(device);
  const modelBuffer = createModelBuffer(device, instances);
  const bindGroup = createRenderBindGroup(device, pipeline, cameraBuffer, modelBuffer);

  const indirectBuffer = device.createBuffer({
    label: 'indirect args buffer',
    size: INDIRECT_ARGS_SIZE,
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
  });

  /* The arguments never change, so they're written once, not every frame. */
  device.queue.writeBuffer(indirectBuffer, 0, new Uint32Array([indexCount, instances, 0, 0, 0]));

  return {
    pipeline,
    execute: (pass: GPURenderPassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);

      pass.setVertexBuffer(0, geometryBuffer);
      pass.setIndexBuffer(indexBuffer, 'uint16');
      pass.drawIndexedIndirect(indirectBuffer, 0);
    }
  };
}
