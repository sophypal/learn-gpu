import type { DrawPacket } from './draw-packet';
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
  depthTexture: GPUTexture;
  drawPacket: DrawPacket;
}

export function drawFrame({ device, context, depthTexture, drawPacket }: FrameResources) {
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

  const {pipeline, vertexBuffers, indexBuffer, bindGroups} = drawPacket;

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroups[0]);

  for (let i = 0; i < vertexBuffers.length; i++) {
    pass.setVertexBuffer(i, vertexBuffers[i]);
  }

  pass.setIndexBuffer(indexBuffer, 'uint16');
  pass.drawIndexed(6, 2, 0);

  pass.end();

  const commands = commandEncoder.finish();
  device.queue.submit([commands]);
}
