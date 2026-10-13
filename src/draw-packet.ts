import { DEPTH_FORMAT } from './render';
import { meshLayout } from './geometry';
import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';

/**
 * Creates the pipeline that draws our quads.
 *
 * A pipeline bundles the shaders with everything fixed about how they run:
 * which entry points, what the vertex input looks like (`meshLayout`), the
 * primitive type, and the format of the texture we draw into.
 *
 * @param device - The GPU device.
 * @param format - The canvas format. The color target has to match it.
 * @returns The render pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createRenderPipeline(device, format);
 * renderPass.setPipeline(pipeline);
 * ```
 */
export function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const vertexShaderModule = device.createShaderModule({
    label: 'vert.wesl',
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    label: 'frag.wesl',
    code: fragmentShader
  });

  return device.createRenderPipeline({
    label: 'render pipeline',
    layout: 'auto',
    vertex: {
      module: vertexShaderModule,
      entryPoint: 'vsMain',
      buffers: [meshLayout]
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: 'fsMain',
      targets: [{
        format
      }]
    },
    /* Back faces are skipped; QUAD_INDICES winds the quad counter-clockwise (front-facing). */
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    /* Keep the nearest fragment: pass when its depth is less than what's stored. */
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: true,
      depthCompare: 'less'
    }
  });
}

/**
 * Creates the bind group that hands the camera buffer to the shader at
 * `@group(0) @binding(0)`.
 *
 * The pipeline uses `layout: 'auto'`, so it works out its bind group layouts
 * from the shader. We ask it for group 0's layout and build the bind group
 * from that.
 *
 * @param device - The GPU device.
 * @param pipeline - The render pipeline whose group 0 this fills.
 * @param cameraBuffer - The camera's uniform buffer.
 * @returns The bind group for group 0.
 *
 * @example
 * ```ts
 * const cameraBindGroup = createCameraBindGroup(device, pipeline, cameraBuffer);
 * renderPass.setBindGroup(0, cameraBindGroup);
 * ```
 */
export function createCameraBindGroup(device: GPUDevice, pipeline: GPURenderPipeline, cameraBuffer: GPUBuffer) {
  return device.createBindGroup({
    label: 'group 0: camera',
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: cameraBuffer }]
  });
}
