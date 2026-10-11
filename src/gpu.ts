export async function initGPU(canvas: HTMLCanvasElement) {
  const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter();
  const device: GPUDevice = await adapter!.requestDevice();
  const context: GPUCanvasContext = canvas.getContext('webgpu')!;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: 'opaque'
  });

  return { device, context, format };
}
