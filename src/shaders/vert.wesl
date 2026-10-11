import package::types::VertexOutput;

struct VertexInput {
    @location(0) position: vec2<f32>
};

@vertex
fn vsMain (vertex: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = vec4<f32>(vertex.position, 0.0, 1.0);

    return out;
}
