import { mat4 } from 'wgpu-matrix';

function createViewProjection(aspect: number) {
  const fov = 60 * Math.PI/180;
  const near = 1;
  const far = 1000;

  const perspective = mat4.perspective(
    fov,
    aspect,
    near,
    far
  );

  const eye = [0.0, 0.0, 10.0];
  const target = [0.0, 0.0, -1.0];
  const up = [0.0, 1.0, 0.0];

  const camera = mat4.lookAt(
    eye,
    target,
    up
  );

  return mat4.mul(perspective, camera);
}

export function createCameraBuffer(device: GPUDevice, aspect: number) {
  const cameraBuffer = device.createBuffer({
    label: 'camera uniform buffer',
    size: 16 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  device.queue.writeBuffer(cameraBuffer, 0, createViewProjection(aspect));

  return cameraBuffer;
}
