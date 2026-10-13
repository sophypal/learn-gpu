import './style.css';
import { initGPU } from './gpu';
import { createQuads } from './geometry';
import { createCameraBuffer } from './camera';
import { createDepthTexture, drawFrame } from './render';
import { createRenderPipeline, createCameraBindGroup } from './draw-packet';

/**
 * Sizes the canvas, sets up the GPU, and draws one frame.
 *
 * @example
 * ```ts
 * init(); // runs once when the page loads
 * ```
 */
async function init() {
  const canvas = document.querySelector('canvas')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const { device, context, format } = await initGPU(canvas);
  const depthTexture = createDepthTexture(device);
  const pipeline = createRenderPipeline(device, format);
  const cameraBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const cameraBindGroup = createCameraBindGroup(device, pipeline, cameraBuffer);
  const { geometryBuffer, indexBuffer, indexCount } = createQuads(device);

  drawFrame({ device, context, depthTexture, pipeline, cameraBindGroup, geometryBuffer, indexBuffer, indexCount });
}

init();
