import './style.css';
import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';

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
 * Creates the pipeline that draws our triangle.
 *
 * A pipeline bundles the shaders with everything fixed about how they run:
 * which entry points, what the vertex input looks like (nothing yet), the
 * primitive type, and the format of the texture we draw into.
 *
 * @param device - The GPU device.
 * @param format - The canvas format. The color target has to match it.
 * @returns The render pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createRenderPipeline(device, format);
 * renderPass.setPipeline(pipeline);
 * ```
 */
function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const vertexShaderModule = device.createShaderModule({
    label: 'vert.wesl',
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    label: 'frag.wesl',
    code: fragmentShader
  });

  return device.createRenderPipeline({
    label: 'render pipeline',
    layout: 'auto',
    vertex: {
      module: vertexShaderModule,
      entryPoint: 'vsMain'
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: 'fsMain',
      targets: [{
        format
      }]
    },
    primitive: {
      topology: 'triangle-list'
    }
  });
}

/** What one frame needs. */
interface FrameResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  pipeline: GPURenderPipeline;
}

/**
 * Records and submits one frame: clear the canvas, then draw the triangle.
 *
 * Nothing runs on the GPU until we submit. The command encoder records
 * commands, `finish()` packs them into a command buffer, and
 * `queue.submit` hands that to the GPU.
 *
 * @param resources - The device, the canvas context, and the pipeline.
 *
 * @example
 * ```ts
 * drawFrame({ device, context, pipeline });
 * ```
 */
function drawFrame({ device, context, pipeline }: FrameResources) {
  const commandEncoder = device.createCommandEncoder({label: 'frame encoder'});

  const renderPass = commandEncoder.beginRenderPass({
    label: 'render pass',
    /* The canvas texture changes every frame, so fetch it each time. */
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: {r: 0, g: 0, b: 0, a: 1}
    }]
  });

  renderPass.setPipeline(pipeline);
  renderPass.draw(3);
  renderPass.end();

  device.queue.submit([commandEncoder.finish({label: 'frame commands'})]);
}

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
  const pipeline = createRenderPipeline(device, format);

  drawFrame({ device, context, pipeline });
}

init();
