import { DEPTH_FORMAT, GroupIndex, type RenderState } from './render-state.ts';
import { meshLayout } from './geometry.ts';
import vertexShader from './shaders/vert.wesl?static';
import fragmentShader from './shaders/frag.wesl?static';

/** One kind of draw: its pipeline, plus a function that records the draw into a render pass. */
export interface DrawPacket {
  pipeline: GPURenderPipeline,
  /**
   * Records this draw into an open render pass.
   *
   * @example
   * ```ts
   * drawPacket.execute(renderPass);
   * ```
   */
  execute: (pass: GPURenderPassEncoder) => void
}

/**
 * Creates the pipeline that draws the quads.
 *
 * Its layout lists the bind group layouts in `GroupIndex` order: the camera, the
 * model table, and the read-only visible list. The vertex shader looks each
 * instance's matrix up through the visible list.
 *
 * @param device - The GPU device.
 * @param format - The canvas format. The color target has to match it.
 * @param renderState - Where the bind group layouts come from.
 * @returns The render pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createRenderPipeline(device, format, renderState);
 * renderPass.setPipeline(pipeline);
 * ```
 */
export function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat, renderState: RenderState) {
  const vertexShaderModule = device.createShaderModule({
    label: 'vert.wesl',
    code: vertexShader
  });

  const fragmentShaderModule = device.createShaderModule({
    label: 'frag.wesl',
    code: fragmentShader
  });

  const layout = device.createPipelineLayout({
    label: 'render pipeline layout',
    bindGroupLayouts: [
      renderState.sharedBindGroups.frame.layout,
      renderState.sharedBindGroups.entity.layout,
      renderState.visibilityBindGroups.draw.layout
    ]
  });

  return device.createRenderPipeline({
    label: 'render pipeline',
    layout,
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
 * Creates the draw packet for the quads.
 *
 * `execute` sets what's specific to this draw (pipeline, group 2, geometry) and
 * issues one `drawIndexedIndirect` with the arguments from the indirect buffer.
 *
 * Bind groups 0 and 1 first, with `renderState.bindShared`.
 *
 * @param device - The GPU device.
 * @param format - The canvas format.
 * @param renderState - Shared buffers and bind groups.
 * @returns A packet whose `execute` records the draw.
 *
 * @example
 * ```ts
 * const drawPacket = createDrawPacket(device, format, renderState);
 * renderState.bindShared(renderPass);
 * drawPacket.execute(renderPass);
 * ```
 */
export function createDrawPacket (device: GPUDevice, format: GPUTextureFormat, renderState: RenderState): DrawPacket {
  const pipeline = createRenderPipeline(device, format, renderState);

  return {
    pipeline,
    execute: (pass: GPURenderPassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(GroupIndex.visibility, renderState.visibilityBindGroups.draw.bindGroup);

      pass.setVertexBuffer(0, renderState.geometryBuffer);
      pass.setIndexBuffer(renderState.indexBuffer, 'uint16');
      pass.drawIndexedIndirect(renderState.indirectBuffer, 0);
    }
  };
}
