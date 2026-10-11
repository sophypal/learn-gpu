import './style.css';
import { initGPU } from './gpu';
import { createQuads } from './geometry';
import { createCameraBuffer } from './camera';
import { createCameraBindGroup, createRenderPipeline } from './pipeline';
import { createDepthTexture, drawFrame } from './render';

async function init() {
  const canvas = document.querySelector('canvas')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const { device, context, format } = await initGPU(canvas);

  const { vertexBuffer, indexBuffer } = createQuads(device);
  const uniformBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);

  const pipeline = createRenderPipeline(device, format);
  const depthTexture = createDepthTexture(device);
  const bindGroup = createCameraBindGroup(device, pipeline, uniformBuffer);

  drawFrame({ device, context, pipeline, bindGroup, vertexBuffer, indexBuffer, depthTexture });
}

init();
