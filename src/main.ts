import './style.css';
import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';

async function init() {
  const canvas = document.querySelector('canvas');
  canvas!.width = window.innerWidth;
  canvas!.height = window.innerHeight;

  const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter();
  const device: GPUDevice = await adapter!.requestDevice();
  const context: GPUCanvasContext = canvas!.getContext('webgpu')!;

  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'opaque'
  });

  const vertexBuffer = device.createBuffer({
    size: (3 * Float32Array.BYTES_PER_ELEMENT + 4 * Uint8Array.BYTES_PER_ELEMENT) * 4,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const indexBuffer = device.createBuffer({
    size: 6 * Uint16Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const vertices = vertexBuffer.getMappedRange();
  const f32 = new Float32Array(vertices);
  const u8 = new Uint8Array(vertices);

  function setVertex (index: number, x: number, y: number, z: number, r: number, g: number, b: number, a: number) {
    const byteStride = 16;
    const floatStride = 4;
    const colorOffset = 12;

    f32.set([x, y, z], index * floatStride);
    u8.set([r, g, b, a], index * byteStride + colorOffset);
  }

  setVertex(0, -0.5, -0.5, 0.0, 255, 0, 0, 255);
  setVertex(1, 0.5, -0.5, 0.0, 0, 255, 0, 255);
  setVertex(2, 0.5, 0.5, 0.0, 0, 0, 255, 255);
  setVertex(3, -0.5, 0.5, 0.0, 0, 255, 0, 255);

  vertexBuffer.unmap();

  new Uint16Array(indexBuffer.getMappedRange()).set([0, 1, 2, 0, 2, 3]);

  indexBuffer.unmap();

  const vertexShaderModule = device.createShaderModule({
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    code: fragmentShader
  });

  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: vertexShaderModule,
      entryPoint: 'vsMain',
      buffers: [{
        arrayStride: 16,
        stepMode: 'vertex',
        attributes: [
          {
            shaderLocation: 0, offset: 0, format: 'float32x3'
          },
          {
            shaderLocation: 1, offset: 12, format: 'unorm8x4'
          }
        ]
      }]
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: 'fsMain',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    }
  });

  const commandEncoder = device.createCommandEncoder();

  const pass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: {r: 0, g: 0, b: 0, a: 0}
    }]
  });

  pass.setPipeline(renderPipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint16');
  pass.drawIndexed(6);
  pass.end();

  const commands = commandEncoder.finish();
  device.queue.submit([commands]);
}

init();
