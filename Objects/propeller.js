
var grobjects = grobjects || [];

var Propellers = undefined;

(function () {
    "use strict";

    var shaderProgram = undefined;
    var buffers = undefined;

    Propellers = function Propellers(name, position, size, color) {
        this.name = name;
        this.position = position || [0, 0, 0];
        this.size = size || 1.0;
        this.color = color || [1.5, 1.5, 1.5];
    }
    
    Propellers.prototype.init = function (drawingState) {
        var gl = drawingState.gl;
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["cube-vs", "cube-fs"]);
        }
        if (!buffers) {
            var arrays = {
                vpos: {
                    numComponents: 3, data: [
                       
                    ]
                },
                vnormal: {
                    numComponents: 3, data: [
                    ]
                }
            };
            populateVertices();
            function populateVertices() {
                var singlePropVertices = [

                    0, -.075, 0,   .9, -.075, 0,   .9, .075, 0,
                    0, -.075, 0,   0, .075, 0,   .9, .075, 0
                ];

                var v3 = twgl.v3;
                var m4 = twgl.m4;
                
                for (var i = 0; i <= 3; ++i) {
                    for (var j = 2; j < singlePropVertices.length; j += 3) {
                        var vecC = v3.create();
                        vecC[0] = singlePropVertices[j - 2];
                        vecC[1] = singlePropVertices[j - 1];
                        vecC[2] = singlePropVertices[j];
                        var model = m4.rotationZ(i * Math.PI/2);
                        vecC = m4.transformPoint(model, vecC);
                        arrays.vpos.data.push(vecC[0]);
                        arrays.vpos.data.push(vecC[1]);
                        arrays.vpos.data.push(vecC[2]);
                    }
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

    Propellers.prototype.draw = function (drawingState) {
        var m4 = twgl.m4;
        var theta = Number(drawingState.realtime)/1500.0;
        var modelM = m4.multiply(m4.multiply(m4.multiply(m4.multiply(
            m4.scaling([this.size, this.size, this.size]), m4.rotationZ(theta)), 
            m4.rotationX(-Math.PI/10)), m4.translation(this.position)), m4.translation([this.size * 0,this.size* 1.5, this.size* .8,]));
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

    Propellers.prototype.center = function (drawingState) {
        return this.position;
    };

})();

// Make sure position and scale is same as corresponding windmill.
grobjects.push(new Propellers("propeller1", [3, 0, 5], 1, [1.5, 1.5, 1.5]));

