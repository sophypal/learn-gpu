import type {DrawPacket} from './draw-packet';
import computeShader from './shaders/cull.wesl?static';

export interface ComputePacket {
  execute: (pass: GPUComputePassEncoder) => void
}

export function createComputePipeline (device: GPUDevice) {
  const shaderModule = device.createShaderModule({code: computeShader});

  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'csMain'
    }
  });

  return pipeline;
}

export function createComputePacket (device: GPUDevice, drawPacket: DrawPacket) {
  const visibleBuffer = device.createBuffer({
    size: drawPacket.instances,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });

  const pipeline = createComputePipeline(device);
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: drawPacket.buffers.modelBuffer
    }, {
      binding: 1,
      resource: visibleBuffer
    }, {
      binding: 2,
      resource: drawPacket.indirectBuffer
    }]
  });

  return {
    execute: (pass: GPUComputePassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.dispatchWorkgroups(drawPacket.instances / 64);
    }
  };
}