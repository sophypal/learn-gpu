import './style.css';
import { initGPU } from './gpu';
import { createCameraBuffer } from './camera';
import { createDepthTexture, drawFrame } from './render';
import { createDrawPacket } from './draw-packet';

/* Number of quads in the scene. */
const INSTANCES = 10000;

/**
 * Sizes the canvas, sets up the GPU and the scene, and starts the frame loop.
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
  const drawPacket = createDrawPacket(device, format, cameraBuffer, INSTANCES);

  /**
   * One frame of the loop: draw, then ask the browser for the next frame.
   * `requestAnimationFrame` calls this once per screen refresh.
   */
  const execute = () => {
    drawFrame({ device, context, depthTexture, drawPacket });

    requestAnimationFrame(execute);
  };

  execute();
}

init();
