import { GroupIndex, type RenderState } from './render-state';
import computeShader from './shaders/cull.wesl?static';

/** One compute job, plus a function that records it into a compute pass. */
export interface ComputePacket {
  /**
   * Records this job's dispatch into an open compute pass.
   *
   * @example
   * ```ts
   * computePacket.execute(computePass);
   * ```
   */
  execute: (pass: GPUComputePassEncoder) => void
}

/*
 * Invocations per workgroup. Passed to the shader as an override constant, so
 * the shader's @workgroup_size and the dispatch count below use the same number.
 */
const WORKGROUP_SIZE = 64;

/**
 * Creates the cull pipeline from cull.wesl.
 *
 * It reuses the frame and entity layouts from the render pipeline, the same
 * objects, and adds the compute version of group 2, where the visible list and
 * indirect args are writable.
 *
 * @param device - The GPU device.
 * @param renderState - Where the bind group layouts come from.
 * @returns The compute pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createComputePipeline(device, renderState);
 * computePass.setPipeline(pipeline);
 * ```
 */
export function createComputePipeline (device: GPUDevice, renderState: RenderState) {
  const shaderModule = device.createShaderModule({label: 'cull.wesl', code: computeShader});

  const pipelineLayout = device.createPipelineLayout({
    label: 'cull pipeline layout',
    bindGroupLayouts: [
      renderState.sharedBindGroups.frame.layout,
      renderState.sharedBindGroups.entity.layout,
      renderState.visibilityBindGroups.compute.layout
    ]
  });

  const pipeline = device.createComputePipeline({
    label: 'cull pipeline',
    layout: pipelineLayout,
    compute: {
      module: shaderModule,
      entryPoint: 'csMain',
      constants: {
        WORKGROUP_SIZE
      }
    }
  });

  return pipeline;
}

/**
 * Creates the cull pass.
 *
 * `execute` runs one invocation per object. `Math.ceil` rounds up to whole
 * workgroups, so the last group can run past the end of the object table; the
 * shader checks `arrayLength` and skips those.
 *
 * Before this runs, bind groups 0 and 1 (`renderState.bindShared`) and zero
 * `instanceCount`.
 *
 * @param device - The GPU device.
 * @param renderState - Shared buffers and bind groups.
 * @returns A packet whose `execute` records the cull dispatch.
 *
 * @example
 * ```ts
 * const computePacket = createComputePacket(device, renderState);
 * renderState.bindShared(computePass);
 * computePacket.execute(computePass);
 * ```
 */
export function createComputePacket (device: GPUDevice, renderState: RenderState): ComputePacket {
  const pipeline = createComputePipeline(device, renderState);

  return {
    execute: (pass: GPUComputePassEncoder) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(GroupIndex.visibility, renderState.visibilityBindGroups.compute.bindGroup);
      pass.dispatchWorkgroups(Math.ceil(renderState.instances / WORKGROUP_SIZE));
    }
  };
}
