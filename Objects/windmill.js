
var grobjects = grobjects || [];

var Windmill = undefined;

(function () {
    "use strict";

    var shaderProgram = undefined;
    var buffers = undefined;

    // Constructor.
    Windmill = function Windmill(name, position, size, color) {
        this.name = name;
        this.position = position || [0, 0, 0];
        this.size = size || 1.0;
        this.color = color || [1.5, 1.5, 1.5];
    }

    Windmill.prototype.init = function (drawingState) {
        var gl = drawingState.gl;
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["cube-vs", "cube-fs"]);
        }
        if (!buffers) {
            var arrays = {
                vpos: {
                    numComponents: 3, data: [
                        // Bottom hexagon.
                        0, 0, -1, .866, 0, -.5, 0, 0, 0,
                        .866, 0, -.5, .866, 0, .5, 0, 0, 0,
                        .866, 0, 0.5, 0, 0, 1, 0, 0, 0,
                        0, 0, 1, -.866, 0, .5, 0, 0, 0,
                        -.866, 0, .5, -.866, 0, -.5, 0, 0, 0,
                        -.866, 0, -.5, 0, 0, -1, 0, 0, 0,

                        // Top hexagon.
                        0, 1.5, -.8, .693, 1.5, -.4, 0, 1.5, 0,
                        .693, 1.5, -.4, .693, 1.5, .4, 0, 1.5, 0,
                        .693, 1.5, .4, 0, 1.5, .8, 0, 1.5, 0,
                        0, 1.5, .8, -.693, 1.5, .4, 0, 1.5, 0,
                        -.693, 1.5, .4, -.693, 1.5, -.4, 0, 1.5, 0,
                        -.693, 1.5, -.4, 0, 1.5, -.8, 0, 1.5, 0,

                        // Sides.
                        0, 0, -1, .866, 0, -.5, 0, 1.5, -.8,
                        0, 1.5, -.8, .693, 1.5, -.4, .866, 0, -.5,

                        .866, 0, -.5, .866, 0, .5, .693, 1.5, -.4,
                        .693, 1.5, -.4, .693, 1.5, .4, .866, 0, .5,

                        .866, 0, 0.5, 0, 0, 1, .693, 1.5, .4,
                        .693, 1.5, .4, 0, 1.5, .8, 0, 0, 1,

                        0, 0, 1, -.866, 0, .5, 0, 1.5, .8,
                        0, 1.5, .8, -.693, 1.5, .4, -.866, 0, .5,

                        -.866, 0, .5, -.866, 0, -.5, -.693, 1.5, .4,
                        -.693, 1.5, .4, -.693, 1.5, -.4, -.866, 0, -.5,

                        -.866, 0, -.5, 0, 0, -1, -.693, 1.5, -.4,
                        -.693, 1.5, -.4, 0, 1.5, -.8, 0, 0, -1,

                        // Top Cone.
                        0, 1.5, -.8, .693, 1.5, -.4, 0, 2.3, 0,
                        .693, 1.5, -.4, .693, 1.5, .4, 0, 2.3, 0,
                        .693, 1.5, .4, 0, 1.5, .8, 0, 2.3, 0,
                        0, 1.5, .8, -.693, 1.5, .4, 0, 2.3, 0,
                        -.693, 1.5, .4, -.693, 1.5, -.4, 0, 2.3, 0,
                        -.693, 1.5, -.4, 0, 1.5, -.8, 0, 2.3, 0,

                    ]
                },
                vnormal: {
                    numComponents: 3, data: [
                    ]
                }
            };
            for (var i = 0; i < 54; ++i) {
                if (i % 3 == 1) {
                    arrays.vpos.data.push(0.5);
                }
                else {
                    arrays.vpos.data.push(arrays.vpos.data[i] * 1.4);
                }
            }
            
            function populateNormals() {
                arrays.vnormal.data = [];
                var v3 = twgl.v3;
                var i;
                var j;
                for (i = 8; i < arrays.vpos.data.length; i += 9) {
                    // Vertex 3.
                    var x3 = arrays.vpos.data[i - 2];
                    var y3 = arrays.vpos.data[i - 1];
                    var z3 = arrays.vpos.data[i];

                    // Vertex 2.
                    var x2 = arrays.vpos.data[i - 5];
                    var y2 = arrays.vpos.data[i - 4];
                    var z2 = arrays.vpos.data[i - 3];

                    // Vertex 1.
                    var x1 = arrays.vpos.data[i - 8];
                    var y1 = arrays.vpos.data[i - 7];
                    var z1 = arrays.vpos.data[i - 6];

                    var vecA = v3.create();
                    vecA[0] = x3 - x1;
                    vecA[1] = y3 - y1;
                    vecA[2] = z3 - z1;
                    var vecB = v3.create();
                    vecB[0] = x2 - x1;
                    vecB[1] = y2 - y1;
                    vecB[2] = z2 - z1;
                    var normal = v3.cross(vecA, vecB);

                    // Check if normal has the correct orientation.
                    var testVec = v3.create();
                    testVec[0] = 0 - x1;
                    testVec[1] = 0 - y1;
                    testVec[2] = 0 - z1;

                    // Inward pointing normal. Reorient.
                    if (v3.dot(testVec, normal) > 0) {
                        normal[0] = -normal[0];
                        normal[1] = -normal[1];
                        normal[2] = -normal[2];
                    }
                    for (j = 0; j < 3; ++j) {
                        arrays.vnormal.data.push(normal[0]);
                        arrays.vnormal.data.push(normal[1]);
                        arrays.vnormal.data.push(normal[2]);
                    }
                }
            }
            populateNormals();
            buffers = twgl.createBufferInfoFromArrays(drawingState.gl, arrays);
        }

    };

    Windmill.prototype.draw = function (drawingState) {
        var modelM = twgl.m4.scaling([this.size, this.size, this.size]);
        twgl.m4.setTranslation(modelM, this.position, modelM);
        //modelM = twgl.m4.identity();
        var normalM = twgl.m4.transpose(twgl.m4.inverse(twgl.m4.multiply(modelM, drawingState.view)));
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
        twgl.setBuffersAndAttributes(gl, shaderProgram, buffers);
        twgl.setUniforms(shaderProgram, {
            view: drawingState.view, proj: drawingState.proj, lightdir: drawingState.sunDirection,
            cubecolor: this.color, model: modelM, normalMatrix: normalM
        });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };

    Windmill.prototype.center = function (drawingState) {
        return this.position;
    };

})();

grobjects.push(new Windmill("windmill1", [3, 0, 5], 1, [1.5, 1.5, 1.5]));

