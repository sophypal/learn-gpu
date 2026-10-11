import package::types::VertexOutput;

@fragment
fn fsMain(vertex: VertexOutput) -> @location(0) vec4<f32> {
    return vertex.position;
}
