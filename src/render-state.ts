import { createQuads } from './geometry';
import { createCameraBuffer } from './camera';
import { mat4 } from 'wgpu-matrix';

const MAT4_SIZE_IN_BYTES = 64;
const EXTENTS = 100;

export const Groups = {
  Frame: 'frame',
  Entity: 'entity',
  ComputeVisibility: 'computeVisibility',
  DrawVisibility: 'drawVisibility'
};

export const GroupOrder = {
  [Groups.Frame]: 0,
  [Groups.Entity]: 1,
  [Groups.ComputeVisibility]: 2,
  [Groups.DrawVisibility]: 2
};

export const Binding = {
  ViewProjection: 0,
  Model: 0,
  VisibilityList: 0,
  IndirectArgs: 1
};

export const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

export interface BindGroups {
  layouts: Record<string, GPUBindGroupLayout>,
  bindGroups: Record<string, GPUBindGroup>
};

export interface RenderState {
  instances: number,
  depthTexture: GPUTexture;
  geometryBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;
  visibleBuffer: GPUBuffer;
  indirectBuffer: GPUBuffer;
  bindGroups: BindGroups;
  sharedBindGroups: BindGroups;
  prepareCompute: (pass: GPUComputePassEncoder) => void;
  prepareRender: (pass: GPURenderPassEncoder) => void;
};

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

export function createSharedBindGroup (device: GPUDevice, uniformBuffer: GPUBuffer, modelBuffer: GPUBuffer) {
  const layouts = {
    [Groups.Frame]: device.createBindGroupLayout({
      label: 'group 0 layout: frame',
      entries: [{
        binding: Binding.ViewProjection,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: {
          type: 'uniform'
        }
      }]
    }),
    [Groups.Entity]: device.createBindGroupLayout({
      label: 'group 1 layout: entity',
      entries: [{
        binding: Binding.Model,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage'
        }
      }]
    })
  };

  const bindGroups = {
    [Groups.Frame]: device.createBindGroup({
      label: 'group 0: frame',
      layout: layouts[Groups.Frame],
      entries: [{
        binding: Binding.ViewProjection,
        resource: uniformBuffer
      }]
    }),
    [Groups.Entity]: device.createBindGroup({
      label: 'group 1: entity',
      layout: layouts[Groups.Entity],
      entries: [{
        binding: Binding.Model,
        resource:  modelBuffer
      }]
    })
  };

  return {layouts, bindGroups};
}

export function createBindGroups (device: GPUDevice, visibleBuffer: GPUBuffer, indirectBuffer: GPUBuffer) {
  const layouts = {
    [Groups.ComputeVisibility]: device.createBindGroupLayout({
      label: 'group 2 layout: compute visibility',
      entries: [{
        binding: Binding.VisibilityList,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'storage'
        }
      }, {
        binding: Binding.IndirectArgs,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'storage'
        }
      }]
    }),
    [Groups.DrawVisibility]: device.createBindGroupLayout({
      label: 'group 2 layout: draw visibility',
      entries: [{
        binding: Binding.VisibilityList,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'read-only-storage'
        }
      }]
    })
  };

  const bindGroups = {
    [Groups.ComputeVisibility]: device.createBindGroup({
      label: 'group 2: compute visibility',
      layout: layouts[Groups.ComputeVisibility],
      entries: [{
        binding: Binding.VisibilityList,
        resource: visibleBuffer
      }, {
        binding: Binding.IndirectArgs,
        resource: indirectBuffer
      }]
    }),
    [Groups.DrawVisibility]: device.createBindGroup({
      label: 'group 2: draw visibility',
      layout: layouts[Groups.DrawVisibility],
      entries: [{
        binding: Binding.VisibilityList,
        resource: visibleBuffer
      }]
    })
  };

  return {layouts, bindGroups};
}

export function prepareRenderState (device: GPUDevice, instances: number): RenderState {
  const depthTexture = createDepthTexture(device);

  const {geometryBuffer, indexBuffer} = createQuads(device);
  const uniformBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const indirectBuffer = device.createBuffer({
    label: 'indirect args buffer',
    size: 20,
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });

  const modelBuffer = device.createBuffer({
    label: 'model buffer',
    size: instances * MAT4_SIZE_IN_BYTES,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  for (let i = 0; i < instances; i++) {
    const x = getRandom(EXTENTS/2, -EXTENTS/2);
    const y = getRandom(EXTENTS/2, -EXTENTS/2);
    const z = getRandom(-EXTENTS);

    mat4.translation([x, y, z], new Float32Array(modelBuffer.getMappedRange(i*MAT4_SIZE_IN_BYTES, MAT4_SIZE_IN_BYTES)));
  }

  modelBuffer.unmap();

  const visibleBuffer = device.createBuffer({
    label: 'visible list buffer',
    size: instances * MAT4_SIZE_IN_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });

  const sharedBindGroups = createSharedBindGroup(device, uniformBuffer, modelBuffer);
  const bindGroups = createBindGroups(device, visibleBuffer, indirectBuffer);

  const drawArgs = new Uint32Array([6, instances, 0, 0, 0]);
  device.queue.writeBuffer(indirectBuffer, 0, drawArgs);


  return {
    instances,
    depthTexture,
    geometryBuffer,
    indexBuffer,
    uniformBuffer,
    visibleBuffer,
    indirectBuffer,
    bindGroups,
    sharedBindGroups,
    prepareCompute: (pass: GPUComputePassEncoder) => {
      pass.setBindGroup(GroupOrder.frame, sharedBindGroups.bindGroups.frame);
      pass.setBindGroup(GroupOrder.entity, sharedBindGroups.bindGroups.entity);
    },
    prepareRender: (pass: GPURenderPassEncoder) => {
      pass.setBindGroup(GroupOrder.frame, sharedBindGroups.bindGroups.frame);
      pass.setBindGroup(GroupOrder.entity, sharedBindGroups.bindGroups.entity);
    }
  };
}
