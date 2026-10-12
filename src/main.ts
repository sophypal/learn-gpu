import './style.css';
import { initGPU } from './gpu';
import { createDepthTexture, drawFrame } from './render';
import { createDrawPacket } from './draw-packet';
// import { createComputePacket } from './compute';

async function init() {
  const canvas = document.querySelector('canvas')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const { device, context, format } = await initGPU(canvas);

  const drawPacket = createDrawPacket(device, format, 10000);
  // const computePacket = createComputePacket(device, drawPacket);
  const depthTexture = createDepthTexture(device);

  const execute = () => {
    drawFrame({ device, context, depthTexture, drawPacket /*, computePacket */ });

    requestAnimationFrame(execute);
  };

  execute();
}

init();
