import type { DrawPacket } from './draw-packet';
import type { RenderState } from './render-state';

/** What one frame needs. */
interface FrameResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  renderState: RenderState;
  drawPacket: DrawPacket;
}

/**
 * Records and submits one frame: clear the canvas and the depth buffer, bind
 * the shared groups, and let the draw packet record its draw.
 *
 * @param resources - The device, canvas context, render state, and draw packet.
 *
 * @example
 * ```ts
 * function frame() {
 *   drawFrame({ device, context, renderState, drawPacket });
 *   requestAnimationFrame(frame);
 * }
 * requestAnimationFrame(frame);
 * ```
 */
export function drawFrame({ device, context, renderState, drawPacket }: FrameResources) {
  const commandEncoder = device.createCommandEncoder({label: 'frame encoder'});

  const renderPass = commandEncoder.beginRenderPass({
    label: 'render pass',
    /* The canvas texture changes every frame, so fetch it each time. */
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
