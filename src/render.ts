import { type DrawPacket } from './draw-packet';
import type { ComputePacket } from './compute';
import { type RenderState } from './render-state';

interface FrameResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  renderState: RenderState;
  drawPacket: DrawPacket;
  computePacket?: ComputePacket;
}

export function drawFrame({ device, context, renderState, drawPacket, computePacket }: FrameResources) {
  const commandEncoder = device.createCommandEncoder({label: 'frame encoder'});


  if (computePacket) {
    commandEncoder.clearBuffer(renderState.indirectBuffer, 4, 4);
    const computePass = commandEncoder.beginComputePass({label: 'cull pass'});

    renderState.prepareCompute(computePass);
    computePacket.execute(computePass);

    computePass.end();
  }

  const renderPass = commandEncoder.beginRenderPass({
    label: 'render pass',
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: {r: 0, g: 0, b: 0, a: 0}
    }],
    depthStencilAttachment: {
      view: renderState.depthTexture,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store'
    }
  });

  const {execute} = drawPacket;

  renderState.prepareRender(renderPass);
  execute(renderPass);

  renderPass.end();

  const commands = commandEncoder.finish({label: 'frame commands'});
  device.queue.submit([commands]);
}
