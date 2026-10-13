import './style.css';

/**
 * Gets a GPU device and hooks the canvas up to it.
 *
 * The adapter is the GPU itself. The device is our connection to it, and
 * everything else (buffers, textures, pipelines) gets created from the device.
 *
 * @param canvas - The canvas we draw into.
 * @returns The device, the canvas context, and the canvas format. A render
 *   pipeline's color target has to use that format.
 * @throws If the browser doesn't support WebGPU or can't find a GPU.
 *
 * @example
 * ```ts
 * const { device, context, format } = await initGPU(canvas);
 * ```
 */
async function initGPU(canvas: HTMLCanvasElement) {
  if (!navigator.gpu) {
    throw new Error('WebGPU is not supported in this browser.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('No WebGPU adapter available.');
  }

  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu')!;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    /*
     * 'opaque' ignores the canvas's alpha channel, so the page behind never shows
     * through. With 'premultiplied', alpha below 1 would blend with the page, and
     * colors would have to be premultiplied by alpha first.
     */
    alphaMode: 'opaque'
  });

  return { device, context, format };
}

/**
 * Sizes the canvas and sets up the GPU.
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

  const { device } = await initGPU(canvas);
  console.log('Got a GPU device:', device);
}

init();
