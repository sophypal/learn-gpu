import {createQuads} from './geometry.ts';
import {createRenderPipeline, createCameraBindGroup} from './pipeline.ts';
import {createCameraBuffer} from './camera';
import {mat4} from 'wgpu-matrix';

export interface DrawPacket {
  pipeline: GPURenderPipeline,
  vertexBuffers: GPUBuffer[],
  indexBuffer: GPUBuffer,
  bindGroups: GPUBindGroup[]
}

export function createDrawPacket (device: GPUDevice, format: GPUTextureFormat) {
  const modelBuffer = device.createBuffer({
    size: 128,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  mat4.translation([-0.25, 0, 0], new Float32Array(modelBuffer.getMappedRange(0, 64)));
  mat4.translation([0.25, 0, -1], new Float32Array(modelBuffer.getMappedRange(64, 64)));

  modelBuffer.unmap();

  const {geometryBuffer, indexBuffer} = createQuads(device);
  const pipeline = createRenderPipeline(device, format);
  const uniformBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
  const bindGroup = createCameraBindGroup(device, pipeline, uniformBuffer);

  return {
    pipeline, 
    vertexBuffers: [
      geometryBuffer,
      modelBuffer
    ],
    indexBuffer,
    bindGroups: [bindGroup]
  }
}