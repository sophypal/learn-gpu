import { GroupIndex, type RenderState } from './render-state';
import computeShader from './shaders/cull.wesl?static';

export interface ComputePacket {
  execute: (pass: GPUComputePassEncoder) => void
}

const WORKGROUP_SIZE = 64;

export function createComputePipeline (device: GPUDevice, renderState: RenderState) {
  const shaderModule = device.createShaderModule({label: 'cull.wesl', code: computeShader});

  const pipelineLayout = device.createPipelineLayout({
    label: 'cull pipeline layout',
    bindGroupLayouts: [
      renderState.sharedBindGroups.frame.layout,
      renderState.sharedBindGroups.entity.layout,
      renderState.visibilityBindGroups.compute.layout
    ]
  });

  const pipeline = device.createComputePipeline({
    label: 'cull pipeline',
    layout: pipelineLayout,
    compute: {
      module: shaderModule,
      entryPoint: 'csMain',
      constants: {
        WORKGROUP_SIZE
      }
    }
  });

  return pipeline;
}

export function createComputePacket (device: GPUDevice, renderState: RenderState): ComputePacket {
  const pipeline = createComputePipeline(device, renderState);

  return {
    execute: (pass: GPUComputePassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(GroupIndex.visibility, renderState.visibilityBindGroups.compute.bindGroup);
      pass.dispatchWorkgroups(Math.ceil(renderState.instances / WORKGROUP_SIZE));
    }
  };
}
