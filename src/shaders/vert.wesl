import package::types::VertexOutput;

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
    @location(2) modelMatrix0: vec4f,
    @location(3) modelMatrix1: vec4f,
    @location(4) modelMatrix2: vec4f,
    @location(5) modelMatrix3: vec4f
};

@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;

fn getModelMatrix (attributes: VertexInput) -> mat4x4f {
    var modelMatrix: mat4x4f;

    modelMatrix[0] = attributes.modelMatrix0;
    modelMatrix[1] = attributes.modelMatrix1;
    modelMatrix[2] = attributes.modelMatrix2;
    modelMatrix[3] = attributes.modelMatrix3;

    return modelMatrix;
}

@vertex
fn vsMain (vertex: VertexInput) -> VertexOutput {
    let modelMatrix: mat4x4f = getModelMatrix(vertex);
    var out: VertexOutput;

    out.position = viewProjection * modelMatrix * vec4f(vertex.position,  1.0);
    out.color = vertex.color;

    return out;
}
