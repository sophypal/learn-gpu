import package::types::VertexOutput;

/* Per-vertex inputs, read from vertex buffer slot 0 as described by meshLayout. */
struct VertexAttributes {
    @location(0) position: vec3f,
};

/*
 * Runs once per vertex. Positions now come from the vertex buffer; colors are
 * still picked from a constant array by vertex_index.
 */
@vertex
fn vsMain (vertexAttributes: VertexAttributes, @builtin(vertex_index) index: u32) -> VertexOutput {
    var colors = array(
        vec4f(1.0, 0.0, 0.0, 1.0),
        vec4f(0.0, 1.0, 0.0, 1.0),
        vec4f(0.0, 0.0, 1.0, 1.0)
    );

    var out: VertexOutput;
    out.position = vec4f(vertexAttributes.position, 1.0);
    out.color = colors[index];

    return out;
}
