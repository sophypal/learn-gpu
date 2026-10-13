import type { DrawPacket } from './draw-packet';
import type { ComputePacket } from './compute';
import { INSTANCE_COUNT_OFFSET, type RenderState } from './render-state';

interface FrameResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  renderState: RenderState;
  drawPacket: DrawPacket;
  computePacket: ComputePacket;
}

export function drawFrame({ device, context, renderState, drawPacket, computePacket }: FrameResources) {
  const commandEncoder = device.createCommandEncoder({label: 'frame encoder'});

  // Zero only instanceCount; indexCount must survive. Clears go between passes:
  // the encoder is locked while a pass is open.
  commandEncoder.clearBuffer(renderState.indirectBuffer, INSTANCE_COUNT_OFFSET, Uint32Array.BYTES_PER_ELEMENT);

  const computePass = commandEncoder.beginComputePass({label: 'cull pass'});
  renderState.bindShared(computePass);
  computePacket.execute(computePass);
  computePass.end();

  const renderPass = commandEncoder.beginRenderPass({
    label: 'render pass',
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: {r: 0, g: 0, b: 0, a: 1}
    }],
    depthStencilAttachment: {
      view: renderState.depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store'
    }
  });

  renderState.bindShared(renderPass);
  drawPacket.execute(renderPass);
  renderPass.end();

  device.queue.submit([commandEncoder.finish({label: 'frame commands'})]);
}
