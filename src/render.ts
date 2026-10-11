import { DEPTH_FORMAT } from './pipeline';

export function createDepthTexture(device: GPUDevice) {
  return device.createTexture({
    size: [window.innerWidth, window.innerHeight],
    format: DEPTH_FORMAT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

interface FrameResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  pipeline: GPURenderPipeline;
  bindGroup: GPUBindGroup;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  depthTexture: GPUTexture;
}

export function drawFrame({ device, context, pipeline, bindGroup, vertexBuffer, indexBuffer, depthTexture }: FrameResources) {
  const commandEncoder = device.createCommandEncoder();

  const pass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: {r: 0, g: 0, b: 0, a: 0}
    }],
    depthStencilAttachment: {
      view: depthTexture,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store'
    }
  });

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint16');
  pass.drawIndexed(6, 1, 0);
  pass.drawIndexed(6, 1, 0, 4);
  pass.end();

  const commands = commandEncoder.finish();
  device.queue.submit([commands]);
}
