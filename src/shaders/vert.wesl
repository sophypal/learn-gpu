import package::types::VertexOutput;

/* Per-vertex inputs, read from vertex buffer slot 0 as described by meshLayout. */
struct VertexAttributes {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
};

/* Runs once per vertex. Everything it needs now comes from the vertex buffer. */
@vertex
fn vsMain (vertexAttributes: VertexAttributes) -> VertexOutput {
    var out: VertexOutput;

    out.position = vec4f(vertexAttributes.position, 1.0);
    out.color = vertexAttributes.color;

    return out;
}
