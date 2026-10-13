import type { DrawPacket } from './draw-packet';
import type { ComputePacket } from './compute';
import { INSTANCE_COUNT_OFFSET, type RenderState } from './render-state';

/** What one frame needs. */
interface FrameResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  renderState: RenderState;
  drawPacket: DrawPacket;
  computePacket: ComputePacket;
}

/**
 * Records and submits one frame: reset the count, cull, draw.
 *
 * It all goes into one command encoder, in this order:
 * 1. `clearBuffer` zeroes `instanceCount`. Atomics only count up, so this has
 *    to happen every frame.
 * 2. The cull pass fills the visible list and the count.
 * 3. The render pass draws that many quads.
 *
 * The GPU runs them in order, so the draw always sees this frame's cull.
 *
 * @param resources - The device, canvas context, render state, and both packets.
 *
 * @example
 * ```ts
 * function frame() {
 *   drawFrame({ device, context, renderState, drawPacket, computePacket });
 *   requestAnimationFrame(frame);
 * }
 * requestAnimationFrame(frame);
 * ```
 */
export function drawFrame({ device, context, renderState, drawPacket, computePacket }: FrameResources) {
  const commandEncoder = device.createCommandEncoder({label: 'frame encoder'});

  /*
   * Zero only instanceCount; indexCount must survive. Clears go between passes:
   * the encoder is locked while a pass is open.
   */
  commandEncoder.clearBuffer(renderState.indirectBuffer, INSTANCE_COUNT_OFFSET, Uint32Array.BYTES_PER_ELEMENT);

  const computePass = commandEncoder.beginComputePass({label: 'cull pass'});
  renderState.bindShared(computePass);
  computePacket.execute(computePass);
  computePass.end();

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
