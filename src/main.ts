import './style.css';
import { initGPU } from './gpu';
import { drawFrame } from './render';
import { prepareRenderState } from './render-state';
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

  const renderState = prepareRenderState(device, INSTANCES);
  const drawPacket = createDrawPacket(device, format, renderState);

  /**
   * One frame of the loop: draw, then ask the browser for the next frame.
   * `requestAnimationFrame` calls this once per screen refresh.
   */
  const execute = () => {
    drawFrame({ device, context, renderState, drawPacket });

    requestAnimationFrame(execute);
  };

  execute();
}

init();
