import package::types::VertexOutput;

/*
 * Runs once per vertex. There's no vertex buffer yet: positions and colors live
 * in the shader, picked by vertex_index, which is 0, 1, 2 for draw(3).
 */
@vertex
fn vsMain (@builtin(vertex_index) index: u32) -> VertexOutput {
    var positions = array(
        vec2f( 0.0,  0.5),
        vec2f(-0.5, -0.5),
        vec2f( 0.5, -0.5)
    );
    var colors = array(
        vec4f(1.0, 0.0, 0.0, 1.0),
        vec4f(0.0, 1.0, 0.0, 1.0),
        vec4f(0.0, 0.0, 1.0, 1.0)
    );

    var out: VertexOutput;
    out.position = vec4f(positions[index], 0.0, 1.0);
    out.color = colors[index];

    return out;
}
