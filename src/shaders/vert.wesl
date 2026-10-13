import package::types::VertexOutput;

/* Per-vertex inputs, read from vertex buffer slot 0 as described by meshLayout. */
struct VertexAttributes {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
};

/* group 0: the camera matrix, the same for every vertex. */
@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;

/* Runs once per vertex: places it with the camera matrix and passes its color on. */
@vertex
fn vsMain (vertexAttributes: VertexAttributes) -> VertexOutput {
    var out: VertexOutput;

    out.position = viewProjection * vec4f(vertexAttributes.position, 1.0);
    out.color = vertexAttributes.color;

    return out;
}
