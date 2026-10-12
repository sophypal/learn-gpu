import './style.css';
import { initGPU } from './gpu';
import { drawFrame } from './render';
import { prepareRenderState } from './render-state';
import { createDrawPacket } from './draw-packet';
import { createComputePacket } from './compute';

const INSTANCES = 10000;

async function init() {
  const canvas = document.querySelector('canvas')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const { device, context, format } = await initGPU(canvas);

  const renderState = prepareRenderState(device, INSTANCES);
  const drawPacket = createDrawPacket(device, format, renderState);
  const computePacket = createComputePacket(device, renderState);

  const execute = () => {
    drawFrame({ device, context, renderState, drawPacket, computePacket });

    requestAnimationFrame(execute);
  };

  execute();
}

init();
