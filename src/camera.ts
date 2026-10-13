import { mat4 } from 'wgpu-matrix';

/**
 * Builds the camera matrix: projection * view.
 *
 * The view part moves the world so the camera sits at the origin looking down
 * -z. The projection part squeezes what the camera sees into clip space, with
 * depth from 0 to 1 (WebGPU's range, not OpenGL's -1 to 1). Multiplying them
 * here once saves every vertex a multiply.
 *
 * @param aspect - Canvas width / height, so things don't look stretched.
 * @returns A column-major 4x4 matrix as 16 floats.
 *
 * @example
 * ```ts
 * const viewProjection = createViewProjection(canvas.width / canvas.height);
 * device.queue.writeBuffer(cameraBuffer, 0, viewProjection);
 * ```
 */
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

  /* Camera 10 units back on +z, looking toward the scene at negative z. */
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

/**
 * Creates the camera's uniform buffer and writes the camera matrix into it.
 *
 * Uniform buffers are for small data that every invocation reads, like this
 * one matrix. `COPY_DST` lets us `writeBuffer` into it, which we'll do every
 * frame once the camera moves.
 *
 * The shaders read it at `@group(0) @binding(0)`.
 *
 * @param device - The GPU device.
 * @param aspect - Canvas width / height.
 * @returns A 64-byte buffer holding one `mat4x4f`.
 *
 * @example
 * ```ts
 * const cameraBuffer = createCameraBuffer(device, window.innerWidth / window.innerHeight);
 * ```
 */
export function createCameraBuffer(device: GPUDevice, aspect: number) {
  const cameraBuffer = device.createBuffer({
    label: 'camera uniform buffer',
    size: 16 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  device.queue.writeBuffer(cameraBuffer, 0, createViewProjection(aspect));

  return cameraBuffer;
}
