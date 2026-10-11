import './style.css';
import { initGPU } from './gpu';
import { createDepthTexture, drawFrame } from './render';
import { createDrawPacket } from './draw-packet';

async function init() {
  const canvas = document.querySelector('canvas')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const { device, context, format } = await initGPU(canvas);

  const drawPacket = createDrawPacket(device, format);
  const depthTexture = createDepthTexture(device);

  drawFrame({ device, context, depthTexture, drawPacket });
}

init();
