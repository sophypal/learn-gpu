import './style.css';

const sharedStructs = /* wgsl */`
struct VertexOutput {
  @builtin(position) position: vec4<f32>
}
`;

const vertexShader = /* wgsl */`
struct VertexInput {
  @location(0) position: vec2<f32>
};

${sharedStructs}

@vertex
fn vsMain (vertex: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.position = vec4<f32>(vertex.position, 0.0, 1.0);

  return out;
}
`;

const fragShader = /* wgsl */`
${sharedStructs}

@fragment
fn fsMain (vertexOutput: VertexOutput) -> @location(0) vec4<f32> {
  return vertexOutput.position;
}
`;

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
    size: 2 * Float32Array.BYTES_PER_ELEMENT * 3,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Float32Array(vertexBuffer.getMappedRange()).set([
    0.0, 0.5,
    -0.5, -0.5,
    0.5, -0.5
  ]);

  vertexBuffer.unmap();

  const vertexShaderModule = device.createShaderModule({
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    code: fragShader
  });

  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: vertexShaderModule,
      entryPoint: 'vsMain',
      buffers: [{
        arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
        stepMode: 'vertex',
        attributes: [
          {
            shaderLocation: 0, offset: 0, format: 'float32x2'
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
      topology: 'triangle-list'
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
  pass.draw(3);
  pass.end();

  const commands = commandEncoder.finish();
  device.queue.submit([commands]);
}

init();
