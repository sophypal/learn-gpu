import { GroupOrder, Groups, type RenderState } from './render-state';
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
      renderState.sharedBindGroups.layouts.frame,
      renderState.sharedBindGroups.layouts.entity,
      renderState.bindGroups.layouts.computeVisibility
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

export function createComputePacket (device: GPUDevice, renderState: RenderState) {
  const pipeline = createComputePipeline(device, renderState);

  return {
    execute: (pass: GPUComputePassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(GroupOrder.computeVisibility, renderState.bindGroups.bindGroups[Groups.ComputeVisibility]);
      pass.dispatchWorkgroups(Math.ceil(renderState.instances / WORKGROUP_SIZE));
    }
  };
}