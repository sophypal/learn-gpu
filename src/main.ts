import './style.css';
import { initGPU } from './gpu';
import { createCameraBuffer } from './camera';
import { createDepthTexture, drawFrame } from './render';
import { createDrawPacket } from './draw-packet';

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
  const cameraBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const drawPacket = createDrawPacket(device, format, cameraBuffer);

  drawFrame({ device, context, depthTexture, drawPacket });
}

init();
