import {createQuads} from './geometry.ts';
import {createRenderPipeline} from './pipeline.ts';
import {createCameraBuffer} from './camera';
import {mat4} from 'wgpu-matrix';

export interface DrawPacket {
  instances: number,
  pipeline: GPURenderPipeline,
  vertexBuffers: GPUBuffer[],
  indexBuffer: GPUBuffer,
  indirectBuffer: GPUBuffer,
  bindGroups: GPUBindGroup[],
  buffers: {
    uniformBuffer: GPUBuffer,
    modelBuffer: GPUBuffer
  },
  execute: (pass: GPURenderPassEncoder) => void
}

const MAT4_SIZE_IN_BYTES = 64;
const EXTENTS = 100;

function getRandom (high: number, low: number = 0) {
  const range = high - low;
  return Math.random() * range + low;
}

export function createRenderBindGroup(device: GPUDevice, pipeline: GPURenderPipeline, uniformBuffer: GPUBuffer, modelBuffer: GPUBuffer) {
  return device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: uniformBuffer
    }, {
      binding: 1,
      resource: modelBuffer
    }]
  });
}

export function createDrawPacket (device: GPUDevice, format: GPUTextureFormat, instances: number) {
  const indirectBuffer = device.createBuffer({
    size: 20,
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
  });

  const modelBuffer = device.createBuffer({
    size: instances * MAT4_SIZE_IN_BYTES,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  for (let i = 0; i < instances; i++) {
    const x = getRandom(EXTENTS/2, -EXTENTS/2);
    const y = getRandom(EXTENTS/2, -EXTENTS/2);
    const z = getRandom(-EXTENTS);

    mat4.translation([x, y, z], new Float32Array(modelBuffer.getMappedRange(i*MAT4_SIZE_IN_BYTES, MAT4_SIZE_IN_BYTES)));
  }

  modelBuffer.unmap();

  const {geometryBuffer, indexBuffer} = createQuads(device);
  const pipeline = createRenderPipeline(device, format);
  const uniformBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const bindGroup = createRenderBindGroup(device, pipeline, uniformBuffer, modelBuffer);

  const drawArgs = new Uint32Array([6, instances, 0, 0, 0]);
  device.queue.writeBuffer(indirectBuffer, 0, drawArgs);

  return {
    instances,
    pipeline, 
    vertexBuffers: [
      geometryBuffer
    ],
    indexBuffer,
    indirectBuffer,
    bindGroups: [bindGroup],
    buffers: {
      uniformBuffer,
      modelBuffer
    },
    execute: (pass: GPURenderPassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);

      pass.setVertexBuffer(0, geometryBuffer);

      pass.setIndexBuffer(indexBuffer, 'uint16');
      pass.drawIndexedIndirect(indirectBuffer, 0);
    }
  };
}