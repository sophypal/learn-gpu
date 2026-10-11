import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';
import { meshLayout, modelLayout } from './vertexLayout';

export const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

export function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const vertexShaderModule = device.createShaderModule({
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    code: fragmentShader
  });

  return device.createRenderPipeline({
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
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: true,
      depthCompare: 'less'
    }
  });
}

export function createCameraBindGroup(device: GPUDevice, pipeline: GPURenderPipeline, uniformBuffer: GPUBuffer) {
  return device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: uniformBuffer
    }]
  });
}
