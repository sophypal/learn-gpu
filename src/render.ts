import { QUAD_VERTEX_COUNT } from './geometry';

/** Depth format. The depth texture and the render pipeline have to agree on it. */
export const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

/**
 * Creates the depth texture. The render pass keeps the nearest fragment per
 * pixel in it, so close quads hide far ones no matter what order they're drawn in.
 *
 * It has to be the same size as the canvas. We only create it once at the
 * window's size, so resizing isn't handled yet.
 *
 * @param device - The GPU device.
 * @returns A `DEPTH_FORMAT` texture to use as the render pass's depth attachment.
 *
 * @example
 * ```ts
 * const depthTexture = createDepthTexture(device);
 * // in beginRenderPass:
 * // depthStencilAttachment: { view: depthTexture.createView(), ... }
 * ```
 */
export function createDepthTexture(device: GPUDevice) {
  return device.createTexture({
    label: 'depth texture',
    size: [window.innerWidth, window.innerHeight],
    format: DEPTH_FORMAT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

/** What one frame needs. */
interface FrameResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  depthTexture: GPUTexture;
  pipeline: GPURenderPipeline;
  cameraBindGroup: GPUBindGroup;
  geometryBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
}

/**
 * Records and submits one frame: clear the canvas, then draw both quads.
 *
 * Nothing runs on the GPU until we submit. The command encoder records
 * commands, `finish()` packs them into a command buffer, and
 * `queue.submit` hands that to the GPU.
 *
 * @param resources - The device, the canvas context, the depth texture, the pipeline, the camera bind group, and the quad buffers.
 *
 * @example
 * ```ts
 * drawFrame({ device, context, depthTexture, pipeline, cameraBindGroup, geometryBuffer, indexBuffer, indexCount });
 * ```
 */
export function drawFrame({ device, context, depthTexture, pipeline, cameraBindGroup, geometryBuffer, indexBuffer, indexCount }: FrameResources) {
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
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store'
    }
  });

  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, cameraBindGroup);
  renderPass.setVertexBuffer(0, geometryBuffer);
  renderPass.setIndexBuffer(indexBuffer, 'uint16');
  renderPass.drawIndexed(indexCount, 1, 0, 0);
  renderPass.drawIndexed(indexCount, 1, 0, QUAD_VERTEX_COUNT);
  renderPass.end();

  device.queue.submit([commandEncoder.finish({label: 'frame commands'})]);
}
