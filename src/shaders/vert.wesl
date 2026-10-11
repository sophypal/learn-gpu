import package::types::VertexOutput;

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) color: vec4f
};

@vertex
fn vsMain (vertex: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = vec4f(vertex.position, 1.0);
    out.color = vertex.color;

    return out;
}
