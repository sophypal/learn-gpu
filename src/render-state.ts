import { createQuads } from './geometry';
import { createCameraBuffer } from './camera';
import { mat4 } from 'wgpu-matrix';

const MAT4_SIZE_IN_BYTES = 64;
const U32_SIZE_IN_BYTES = 4;
const EXTENTS = 100;

export const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

// drawIndexedIndirect reads 5 u32s: indexCount, instanceCount, firstIndex, baseVertex, firstInstance.
export const INDIRECT_ARGS_SIZE = 5 * U32_SIZE_IN_BYTES;
export const INSTANCE_COUNT_OFFSET = 1 * U32_SIZE_IN_BYTES;

// A layout's position in a pipeline layout's bindGroupLayouts is its group index,
// so every pipeline lists its layouts in this order.
export const GroupIndex = {
  frame: 0,
  entity: 1,
  visibility: 2
} as const;

interface BindGroupPair {
  layout: GPUBindGroupLayout,
  bindGroup: GPUBindGroup
}

// Groups 0 and 1 are shared: both pipelines see them the same way.
export interface SharedBindGroups {
  frame: BindGroupPair,
  entity: BindGroupPair
}

// Group 2 is not: compute writes the visible list, vertex only reads it.
export interface VisibilityBindGroups {
  compute: BindGroupPair,
  draw: BindGroupPair
}

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
  bindShared: (pass: GPUBindingCommandsMixin) => void
}

function getRandom (high: number, low: number = 0) {
  const range = high - low;
  return Math.random() * range + low;
}

export function createDepthTexture(device: GPUDevice) {
  return device.createTexture({
    label: 'depth texture',
    size: [window.innerWidth, window.innerHeight],
    format: DEPTH_FORMAT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

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

export function prepareRenderState (device: GPUDevice, instances: number): RenderState {
  const depthTexture = createDepthTexture(device);
  const { geometryBuffer, indexBuffer, indexCount } = createQuads(device);
  const cameraBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const modelBuffer = createModelBuffer(device, instances);

  // One u32 object index per visible object, sized for the worst case: all visible.
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

  // The CPU owns the geometry arguments; the cull pass owns instanceCount.
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
    bindShared: (pass: GPUBindingCommandsMixin) => {
      pass.setBindGroup(GroupIndex.frame, sharedBindGroups.frame.bindGroup);
      pass.setBindGroup(GroupIndex.entity, sharedBindGroups.entity.bindGroup);
    }
  };
}
