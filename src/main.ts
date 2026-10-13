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

/* Bytes per vertex: a position of three floats. */
const VERTEX_STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT;
const FLOAT_STRIDE = VERTEX_STRIDE / Float32Array.BYTES_PER_ELEMENT;
const VERTEX_COUNT = 3;

/**
 * Tells the pipeline how to read one vertex from the vertex buffer: 12 bytes,
 * a `float32x3` position at `@location(0)`.
 */
const meshLayout: GPUVertexBufferLayout = {
  arrayStride: VERTEX_STRIDE,
  stepMode: 'vertex',
  attributes: [
    {
      shaderLocation: 0, offset: 0, format: 'float32x3'
    }
  ]
};

/**
 * Creates a vertex buffer holding one triangle.
 *
 * We fill it with `mappedAtCreation`: the buffer starts out mapped, we write
 * into `getMappedRange()`, and `unmap()` hands it over to the GPU. That doesn't
 * need `COPY_DST`.
 *
 * @param device - The GPU device.
 * @returns The vertex buffer.
 *
 * @example
 * ```ts
 * const { geometryBuffer } = createTriangle(device);
 * pass.setVertexBuffer(0, geometryBuffer);
 * pass.draw(3);
 * ```
 */
function createTriangle(device: GPUDevice) {
  const geometryBuffer = device.createBuffer({
    label: 'triangle vertex buffer',
    size: VERTEX_STRIDE * VERTEX_COUNT,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  });

  /* Typed-array offsets count elements, not bytes. */
  const f32 = new Float32Array(geometryBuffer.getMappedRange());

  /**
   * Writes one vertex position.
   *
   * @param index - Which vertex. Its float offset is `index * FLOAT_STRIDE`.
   *
   * @example
   * ```ts
   * setVertex(0, 0.0, 0.5, 0.0); // top corner
   * ```
   */
  function setVertex (index: number, x: number, y: number, z: number) {
    f32.set([x, y, z], index * FLOAT_STRIDE);
  }

  setVertex(0, 0.0, 0.5, 0.0);
  setVertex(1, -0.5, -0.5, 0.0);
  setVertex(2, 0.5, -0.5, 0.0);

  geometryBuffer.unmap();

  return { geometryBuffer };
}

/**
 * Creates the pipeline that draws our triangle.
 *
 * A pipeline bundles the shaders with everything fixed about how they run:
 * which entry points, what the vertex input looks like (`meshLayout`), the
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
      entryPoint: 'vsMain',
      buffers: [meshLayout]
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
  geometryBuffer: GPUBuffer;
}

/**
 * Records and submits one frame: clear the canvas, then draw the triangle.
 *
 * Nothing runs on the GPU until we submit. The command encoder records
 * commands, `finish()` packs them into a command buffer, and
 * `queue.submit` hands that to the GPU.
 *
 * @param resources - The device, the canvas context, the pipeline, and the vertex buffer.
 *
 * @example
 * ```ts
 * drawFrame({ device, context, pipeline, geometryBuffer });
 * ```
 */
function drawFrame({ device, context, pipeline, geometryBuffer }: FrameResources) {
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
  renderPass.setVertexBuffer(0, geometryBuffer);
  renderPass.draw(VERTEX_COUNT);
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
  const { geometryBuffer } = createTriangle(device);

  drawFrame({ device, context, pipeline, geometryBuffer });
}

init();
