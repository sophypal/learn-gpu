import package::types::VertexOutput;

/* Runs once per covered pixel; outputs the interpolated vertex color to color target 0. */
@fragment
fn fsMain(vertex: VertexOutput) -> @location(0) vec4f {
    return vertex.color;
}