import { DEPTH_FORMAT, type RenderState } from './render-state.ts';
import { meshLayout } from './geometry.ts';
import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';

export interface DrawPacket {
  pipeline: GPURenderPipeline,
  execute: (pass: GPURenderPassEncoder) => void
}

export function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat, renderState: RenderState) {
  const vertexShaderModule = device.createShaderModule({
    label: 'vert.wesl',
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    label: 'frag.wesl',
    code: fragmentShader
  });

  const layout = device.createPipelineLayout({
    label: 'render pipeline layout',
    bindGroupLayouts: [
      renderState.sharedBindGroups.layouts.frame,
      renderState.sharedBindGroups.layouts.entity,
      //renderState.bindGroups.layouts.drawVisibility
    ]
  });

  return device.createRenderPipeline({
    label: 'render pipeline',
    layout,
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

export function createDrawPacket (device: GPUDevice, format: GPUTextureFormat, renderState: RenderState) {
  const pipeline = createRenderPipeline(device, format, renderState);

  return {
    pipeline, 
    execute: (pass: GPURenderPassEncoder) => {
      pass.setPipeline(pipeline);

      pass.setVertexBuffer(0, renderState.geometryBuffer);
      pass.setIndexBuffer(renderState.indexBuffer, 'uint16');
      pass.drawIndexedIndirect(renderState.indirectBuffer, 0);
    }
  };
}