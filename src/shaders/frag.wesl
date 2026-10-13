import package::types::VertexOutput;

@fragment
fn fsMain(vertex: VertexOutput) -> @location(0) vec4f {
    return vertex.color;
}