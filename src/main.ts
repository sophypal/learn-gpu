import './style.css';
import vertexShader from './shaders/vert.wesl?static'
import fragmentShader from './shaders/frag.wesl?static'
import {mat4} from 'wgpu-matrix'

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
    size: (3 * Float32Array.BYTES_PER_ELEMENT + 4 * Uint8Array.BYTES_PER_ELEMENT) * 8,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const indexBuffer = device.createBuffer({
    size: 6 * Uint16Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  const uniformBuffer = device.createBuffer({
    size: 16 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  const fov = 60 * Math.PI/180;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 1;
  const far = 100;

  const perspective = mat4.perspective(
    fov,
    aspect,
    near,
    far
  );

  const eye = [0.0, 0.0, 1.0];
  const target = [0.0, 0.0, -1.0];
  const up = [0.0, 1.0, 0.0];

  const camera = mat4.lookAt(
    eye,
    target,
    up
  );


  const viewProjection = mat4.mul(perspective, camera);
  device.queue.writeBuffer(uniformBuffer, 0, viewProjection);

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

  setVertex(0, -0.75, -0.5, -1.0, 255, 0, 0, 255);
  setVertex(1, 0.25, -0.5, -1.0, 0, 255, 0, 255);
  setVertex(2, 0.25, 0.5, -1.0, 0, 0, 255, 255);
  setVertex(3, -0.75, 0.5, -1.0, 0, 255, 0, 255);

  setVertex(4, -0.25, -0.5, -2.0, 255, 0, 0, 255);
  setVertex(5, 0.75, -0.5, -2.0, 0, 255, 0, 255);
  setVertex(6, 0.75, 0.5, -2.0, 0, 0, 255, 255);
  setVertex(7, -0.25, 0.5, -2.0, 0, 255, 0, 255);

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
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less'
    }
  });

  const depthTexture = device.createTexture({
    size: [window.innerWidth, window.innerHeight],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  })

  const bindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: uniformBuffer
    }]
  })

  const commandEncoder = device.createCommandEncoder();

  const pass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: {r: 0, g: 0, b: 0, a: 0}
    }],
    depthStencilAttachment: {
      view: depthTexture,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store'
    }
  });


  pass.setPipeline(renderPipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint16');
  pass.drawIndexed(6, 1, 0);
  pass.drawIndexed(6, 1, 0, 4);
  pass.end();

  const commands = commandEncoder.finish();
  device.queue.submit([commands]);
}

init();