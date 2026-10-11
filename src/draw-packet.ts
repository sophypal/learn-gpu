import {createQuads} from './geometry.ts';
import {createRenderPipeline, createCameraBindGroup} from './pipeline.ts';
import {createCameraBuffer} from './camera';
import {mat4} from 'wgpu-matrix';

export interface DrawPacket {
  instances: number,
  pipeline: GPURenderPipeline,
  vertexBuffers: GPUBuffer[],
  indexBuffer: GPUBuffer,
  bindGroups: GPUBindGroup[],
  execute: (pass: GPURenderPassEncoder) => void
}

const MAT4_SIZE_IN_BYTES = 64;
const EXTENTS = 100;

function getRandom (high: number, low: number = 0) {
  const range = high - low;
  return Math.random() * range + low;
}

export function createDrawPacket (device: GPUDevice, format: GPUTextureFormat, instances: number) {
  const modelBuffer = device.createBuffer({
    size: instances * MAT4_SIZE_IN_BYTES,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  for (let i = 0; i < instances; i++) {
    const x = getRandom(EXTENTS/2, -EXTENTS/2);
    const y = getRandom(EXTENTS/2, -EXTENTS/2);
    const z = getRandom(-EXTENTS)

    mat4.translation([x, y, z], new Float32Array(modelBuffer.getMappedRange(i*MAT4_SIZE_IN_BYTES, MAT4_SIZE_IN_BYTES)));
  }

  modelBuffer.unmap();

  const {geometryBuffer, indexBuffer} = createQuads(device);
  const pipeline = createRenderPipeline(device, format);
  const uniformBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const bindGroup = createCameraBindGroup(device, pipeline, uniformBuffer);

  return {
    instances,
    pipeline, 
    vertexBuffers: [
      geometryBuffer,
      modelBuffer
    ],
    indexBuffer,
    bindGroups: [bindGroup],
    execute: (pass: GPURenderPassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);

      pass.setVertexBuffer(0, geometryBuffer);
      pass.setVertexBuffer(1, modelBuffer);

      pass.setIndexBuffer(indexBuffer, 'uint16');
      pass.drawIndexed(6, instances);
    }
  }
}