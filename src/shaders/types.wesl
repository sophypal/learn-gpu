/*
 * What the vertex shader hands to the rasterizer, and the fragment shader receives.
 * `position` is clip space (the GPU divides by w); `color` is interpolated across the triangle.
 */
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
};
