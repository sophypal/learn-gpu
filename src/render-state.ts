import { createQuads } from './geometry';
import { createCameraBuffer } from './camera';
import { mat4 } from 'wgpu-matrix';

const MAT4_SIZE_IN_BYTES = 64;
const U32_SIZE_IN_BYTES = 4;
const EXTENTS = 100;

/** Depth format. The depth texture and the render pipeline have to agree on it. */
export const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

/**
 * Size of the indirect draw arguments in bytes. `drawIndexedIndirect` reads
 * five u32s: `indexCount, instanceCount, firstIndex, baseVertex, firstInstance`.
 */
export const INDIRECT_ARGS_SIZE = 5 * U32_SIZE_IN_BYTES;
/** Where `instanceCount` sits in the indirect arguments. The cull pass writes it; each frame resets it. */
export const INSTANCE_COUNT_OFFSET = 1 * U32_SIZE_IN_BYTES;

/**
 * Bind group numbers, matching `@group(N)` in the shaders.
 *
 * The order of layouts in a pipeline layout decides the group numbers, so every
 * pipeline lists its layouts in this order. They go roughly by how often they
 * change: per frame, per object, then the cull results.
 *
 * @example
 * ```ts
 * pass.setBindGroup(GroupIndex.frame, sharedBindGroups.frame.bindGroup);
 * ```
 */
export const GroupIndex = {
  frame: 0,
  entity: 1,
  visibility: 2
} as const;

/** A bind group layout and the bind group made from it, kept together. */
interface BindGroupPair {
  layout: GPUBindGroupLayout,
  bindGroup: GPUBindGroup
}

/** Groups 0 and 1. Both pipelines use them the same way, so they share them. */
export interface SharedBindGroups {
  frame: BindGroupPair,
  entity: BindGroupPair
}

/** Group 2, one per pipeline. Compute writes the visible list; the vertex shader only reads it. */
export interface VisibilityBindGroups {
  compute: BindGroupPair,
  draw: BindGroupPair
}

/** What the cull and draw packets share: buffers, bind groups, and a helper to bind the shared groups. */
export interface RenderState {
  instances: number,
  indexCount: number,
  depthTexture: GPUTexture,
  geometryBuffer: GPUBuffer,
  indexBuffer: GPUBuffer,
  cameraBuffer: GPUBuffer,
  indirectBuffer: GPUBuffer,
  sharedBindGroups: SharedBindGroups,
  visibilityBindGroups: VisibilityBindGroups,
  /**
   * Binds groups 0 (frame) and 1 (entity) on a compute or render pass.
   *
   * @example
   * ```ts
   * renderState.bindShared(computePass);
   * renderState.bindShared(renderPass);
   * ```
   */
  bindShared: (pass: GPUBindingCommandsMixin) => void
}

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
 * Creates the depth texture. The render pass keeps the nearest fragment per
 * pixel in it, so close quads hide far ones no matter what order they're drawn in.
 *
 * It has to be the same size as the canvas. We only create it once at the
 * window's size, so resizing isn't handled yet.
 *
 * @param device - The GPU device.
 * @returns A `DEPTH_FORMAT` texture to use as the render pass's depth attachment.
 *
 * @example
 * ```ts
 * const depthTexture = createDepthTexture(device);
 * // in beginRenderPass:
 * // depthStencilAttachment: { view: depthTexture.createView(), ... }
 * ```
 */
export function createDepthTexture(device: GPUDevice) {
  return device.createTexture({
    label: 'depth texture',
    size: [window.innerWidth, window.innerHeight],
    format: DEPTH_FORMAT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

/**
 * Creates the object table: one model matrix per object, scattered randomly
 * through a 100-unit box in front of the camera.
 *
 * This has to be a storage buffer. 10,000 matrices at 64 bytes each is 640 KB,
 * and uniform buffers are only guaranteed 64 KB. Storage also lets the shader
 * declare `array<mat4x4f>` without a length; the length comes from the buffer.
 *
 * The cull pass and the vertex shader both read it at `@group(1) @binding(0)`.
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

/**
 * Creates groups 0 and 1, which the cull and render pipelines bind the same way.
 *
 * Sharing works because both pipeline layouts use these exact layout objects at
 * the same group numbers, so one bind group fits both pipelines. Visibility
 * includes VERTEX and COMPUTE since both stages read them.
 *
 * | Group | Binding | Resource      | Type                |
 * |-------|---------|---------------|---------------------|
 * | 0     | 0       | camera matrix | `uniform`           |
 * | 1     | 0       | model table   | `read-only-storage` |
 *
 * @param device - The GPU device.
 * @param cameraBuffer - The camera's uniform buffer.
 * @param modelBuffer - The object table.
 * @returns Layout and bind group for groups 0 and 1.
 *
 * @example
 * ```ts
 * const shared = createSharedBindGroups(device, cameraBuffer, modelBuffer);
 * device.createPipelineLayout({
 *   bindGroupLayouts: [shared.frame.layout, shared.entity.layout, visibility.draw.layout]
 * });
 * ```
 */
function createSharedBindGroups (device: GPUDevice, cameraBuffer: GPUBuffer, modelBuffer: GPUBuffer): SharedBindGroups {
  const frameLayout = device.createBindGroupLayout({
    label: 'group 0 layout: frame',
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
      buffer: { type: 'uniform' }
    }]
  });

  const entityLayout = device.createBindGroupLayout({
    label: 'group 1 layout: entity',
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
      buffer: { type: 'read-only-storage' }
    }]
  });

  return {
    frame: {
      layout: frameLayout,
      bindGroup: device.createBindGroup({
        label: 'group 0: frame',
        layout: frameLayout,
        entries: [{ binding: 0, resource: cameraBuffer }]
      })
    },
    entity: {
      layout: entityLayout,
      bindGroup: device.createBindGroup({
        label: 'group 1: entity',
        layout: entityLayout,
        entries: [{ binding: 0, resource: modelBuffer }]
      })
    }
  };
}

/**
 * Creates group 2 twice, once for each pipeline, over the same two buffers.
 *
 * We can't share this one. The cull pass writes the visible list and the vertex
 * shader only reads it, and a layout entry only has one type. On top of that, a
 * writable storage binding can't be visible to the vertex stage. So each
 * pipeline gets its own layout at group 2.
 *
 * | Layout  | Binding | Resource      | Type                |
 * |---------|---------|---------------|---------------------|
 * | compute | 0       | visible list  | `storage`           |
 * | compute | 1       | indirect args | `storage`           |
 * | draw    | 0       | visible list  | `read-only-storage` |
 *
 * @param device - The GPU device.
 * @param visibleBuffer - One u32 object index per visible object.
 * @param indirectBuffer - The arguments for `drawIndexedIndirect`.
 * @returns Layout and bind group for group 2, compute side and draw side.
 *
 * @example
 * ```ts
 * const visibility = createVisibilityBindGroups(device, visibleBuffer, indirectBuffer);
 * computePass.setBindGroup(GroupIndex.visibility, visibility.compute.bindGroup);
 * renderPass.setBindGroup(GroupIndex.visibility, visibility.draw.bindGroup);
 * ```
 */
function createVisibilityBindGroups (device: GPUDevice, visibleBuffer: GPUBuffer, indirectBuffer: GPUBuffer): VisibilityBindGroups {
  const computeLayout = device.createBindGroupLayout({
    label: 'group 2 layout: compute visibility',
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'storage' }
    }, {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'storage' }
    }]
  });

  const drawLayout = device.createBindGroupLayout({
    label: 'group 2 layout: draw visibility',
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: { type: 'read-only-storage' }
    }]
  });

  return {
    compute: {
      layout: computeLayout,
      bindGroup: device.createBindGroup({
        label: 'group 2: compute visibility',
        layout: computeLayout,
        entries: [
          { binding: 0, resource: visibleBuffer },
          { binding: 1, resource: indirectBuffer }
        ]
      })
    },
    draw: {
      layout: drawLayout,
      bindGroup: device.createBindGroup({
        label: 'group 2: draw visibility',
        layout: drawLayout,
        entries: [{ binding: 0, resource: visibleBuffer }]
      })
    }
  };
}

/**
 * Creates all the shared buffers and bind groups for the scene.
 *
 * Each frame then goes like this:
 * 1. `clearBuffer` sets `instanceCount` back to 0.
 * 2. The cull pass adds every visible object's index to the visible list and
 *    counts it with `atomicAdd`.
 * 3. `drawIndexedIndirect` draws that many instances, and the vertex shader
 *    looks each one up with `model[visibleList[instance_index]]`.
 *
 * @param device - The GPU device.
 * @param instances - How many objects in the scene.
 * @returns The state the cull and draw packets share.
 *
 * @example
 * ```ts
 * const renderState = prepareRenderState(device, 10_000);
 * const drawPacket = createDrawPacket(device, format, renderState);
 * const computePacket = createComputePacket(device, renderState);
 * ```
 */
export function prepareRenderState (device: GPUDevice, instances: number): RenderState {
  const depthTexture = createDepthTexture(device);
  const { geometryBuffer, indexBuffer, indexCount } = createQuads(device);
  const cameraBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const modelBuffer = createModelBuffer(device, instances);

  /*
   * One u32 object index per visible object, sized for the worst case: all visible.
   * Its size is the capacity; this frame's length is instanceCount.
   */
  const visibleBuffer = device.createBuffer({
    label: 'visible list buffer',
    size: instances * U32_SIZE_IN_BYTES,
    usage: GPUBufferUsage.STORAGE
  });

  const indirectBuffer = device.createBuffer({
    label: 'indirect args buffer',
    size: INDIRECT_ARGS_SIZE,
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });

  /* The CPU owns the geometry arguments; the cull pass owns instanceCount. */
  device.queue.writeBuffer(indirectBuffer, 0, new Uint32Array([indexCount, 0, 0, 0, 0]));

  const sharedBindGroups = createSharedBindGroups(device, cameraBuffer, modelBuffer);
  const visibilityBindGroups = createVisibilityBindGroups(device, visibleBuffer, indirectBuffer);

  return {
    instances,
    indexCount,
    depthTexture,
    geometryBuffer,
    indexBuffer,
    cameraBuffer,
    indirectBuffer,
    sharedBindGroups,
    visibilityBindGroups,
    /* Works on compute and render passes alike: both have setBindGroup. */
    bindShared: (pass: GPUBindingCommandsMixin) => {
      pass.setBindGroup(GroupIndex.frame, sharedBindGroups.frame.bindGroup);
      pass.setBindGroup(GroupIndex.entity, sharedBindGroups.entity.bindGroup);
    }
  };
}
