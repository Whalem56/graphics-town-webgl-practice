/**
 * Created by gleicher on 10/9/15.
 */
/*
 a second example object for graphics town
 check out "simplest" first

 the cube is more complicated since it is designed to allow making many cubes

 we make a constructor function that will make instances of cubes - each one gets
 added to the grobjects list

 we need to be a little bit careful to distinguish between different kinds of initialization
 1) there are the things that can be initialized when the function is first defined
    (load time)
 2) there are things that are defined to be shared by all cubes - these need to be defined
    by the first init (assuming that we require opengl to be ready)
 3) there are things that are to be defined for each cube instance
 */
var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Cube = undefined;
var SpinningCube = undefined;

// this is a function that runs at loading time (note the parenthesis at the end)
(function () {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;

    // constructor for Cubes
    Cube = function Cube(name, position, size, color) {
        this.name = name;
        this.position = position || [0, 0, 0];
        this.size = size || 1.0;
        this.color = color || [.7, .8, .9];
    }
    Cube.prototype.init = function(drawingState) {
        var gl=drawingState.gl;
        // create the shaders once - for all cubes
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["cube-vs", "cube-fs"]);
        }
        if (!buffers) {
            var arrays = {
                vpos : { numComponents: 3, data: [
                    -.5,-.5,-.5,  .5,-.5,-.5,  .5, .5,-.5,        -.5,-.5,-.5,  .5, .5,-.5, -.5, .5,-.5,    // z = 0
                    -.5,-.5, .5,  .5,-.5, .5,  .5, .5, .5,        -.5,-.5, .5,  .5, .5, .5, -.5, .5, .5,    // z = 1
                    -.5,-.5,-.5,  .5,-.5,-.5,  .5,-.5, .5,        -.5,-.5,-.5,  .5,-.5, .5, -.5,-.5, .5,    // y = 0
                    -.5, .5,-.5,  .5, .5,-.5,  .5, .5, .5,        -.5, .5,-.5,  .5, .5, .5, -.5, .5, .5,    // y = 1
                    -.5,-.5,-.5, -.5, .5,-.5, -.5, .5, .5,        -.5,-.5,-.5, -.5, .5, .5, -.5,-.5, .5,    // x = 0
                     .5,-.5,-.5,  .5, .5,-.5,  .5, .5, .5,         .5,-.5,-.5,  .5, .5, .5,  .5,-.5, .5     // x = 1
                ] },
                vnormal : {numComponents:3, data: [
                    0,0,-1, 0,0,-1, 0,0,-1,     0,0,-1, 0,0,-1, 0,0,-1,
                    0,0,1, 0,0,1, 0,0,1,        0,0,1, 0,0,1, 0,0,1,
                    0,-1,0, 0,-1,0, 0,-1,0,     0,-1,0, 0,-1,0, 0,-1,0,
                    0,1,0, 0,1,0, 0,1,0,        0,1,0, 0,1,0, 0,1,0,
                    -1,0,0, -1,0,0, -1,0,0,     -1,0,0, -1,0,0, -1,0,0,
                    1,0,0, 1,0,0, 1,0,0,        1,0,0, 1,0,0, 1,0,0,
                ]}
            };
            function populateNormals() {
                console.log(arrays.vnormal.data);
                arrays.vnormal.data = [];
                var v3 = twgl.v3;
                var i;
                var j;
                for (i = 8; i < arrays.vpos.data.length; i += 9) {
                    // Vertex 3.
                    var x3 = arrays.vpos.data[i-2];
                    var y3 = arrays.vpos.data[i-1];
                    var z3 = arrays.vpos.data[i];

                    // Vertex 2.
                    var x2 = arrays.vpos.data[i-5];
                    var y2 = arrays.vpos.data[i-4];
                    var z2 = arrays.vpos.data[i-3];

                    // Vertex 1.
                    var x1 = arrays.vpos.data[i-8];
                    var y1 = arrays.vpos.data[i-7];
                    var z1 = arrays.vpos.data[i-6];

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
                console.log(arrays.vnormal.data);
            }
            populateNormals();
            buffers = twgl.createBufferInfoFromArrays(drawingState.gl,arrays);
        }

    };
    Cube.prototype.draw = function(drawingState) {
        // we make a model matrix to place the cube in the world
        var modelM = twgl.m4.scaling([this.size,this.size,this.size]);
        twgl.m4.setTranslation(modelM,this.position,modelM);
        // the drawing coce is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            cubecolor:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };


    Cube.prototype.center = function (drawingState) {
        return this.position;
    }

    // Cube.prototype.init = function (drawingState) {
    //     console.log("inside init!");
    //     var gl = drawingState.gl;
    //     // create the shaders once - for all cubes.
    //     if (!shaderProgram) {
    //         // Read shader source.
    //         var vertexSource = document.getElementById("cube-noNormal-vs").text;
    //         var fragmentSource = document.getElementById("cube-noNormal-fs").text;

    //         // Compile vertex shader.
    //         var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    //         gl.shaderSource(vertexShader, vertexSource);
    //         gl.compileShader(vertexShader);
    //         if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    //             alert(gl.getShaderInfoLog(vertexShader)); return null;
    //         }

    //         // Compile fragment shader.
    //         var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    //         gl.shaderSource(fragmentShader, fragmentSource);
    //         gl.compileShader(fragmentShader);
    //         if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    //             alert(gl.getShaderInfoLog(fragmentShader)); return null;
    //         }

    //         // Attach the shaders and link
    //         shaderProgram = gl.createProgram();
    //         gl.attachShader(shaderProgram, vertexShader);
    //         gl.attachShader(shaderProgram, fragmentShader);
    //         gl.linkProgram(shaderProgram);
    //         if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    //             alert("Could not initialize shaders");
    //         }
    //         gl.useProgram(shaderProgram);

    //         shaderProgram.posAttribute = gl.getAttribLocation(shaderProgram, "vpos");
    //         gl.enableVertexAttribArray(shaderProgram.posAttribute);

    //         //shaderProgram.normalAttribute = gl.getAttribLocation(shaderProgram, "vnormal");
    //         //gl.enableVertexAttribArray(shaderProgram.normalAttribute);

    //         shaderProgram.texcoordAttribute = gl.getAttribLocation(shaderProgram, "vtexCoord");
    //         gl.enableVertexAttribArray(shaderProgram.texcoordAttribute);

    //         shaderProgram.view = gl.getUniformLocation(shaderProgram, "view");
    //         shaderProgram.proj = gl.getUniformLocation(shaderProgram, "proj");
    //         shaderProgram.model = gl.getUniformLocation(shaderProgram, "model");
    //         shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram, "normalMatrix");
    //         shaderProgram.lightdir = gl.getUniformLocation(shaderProgram, "lightdir");
    //         shaderProgram.cubecolor = gl.getUniformLocation(shaderProgram, "cubecolor");

    //         // Attach uniform "sampler2d" to texture unit #0.
    //         shaderProgram.texSampler = gl.getUniformLocation(shaderProgram, "texSampler");
    //         gl.uniform1i(shaderProgram.texSampler, 0);

    //         this.vertexPos = new Float32Array(
    //             [
    //                 1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1,
    //                 1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1,
    //                 1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1,
    //                -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1,
    //                -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1,
    //                 1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1
    //             ]);

    //         var vertexTextureCoords = new Float32Array(
    //             [
    //                 0, 0,   1, 0,   1, 1,   0, 1,
    //                 1, 0,   1, 1,   0, 1,   0, 0,
    //                 0, 1,   0, 0,   1, 0,   1, 1,
    //                 0, 0,   1, 0,   1, 1,   0, 1,
    //                 1, 1,   0, 1,   0, 0,   1, 0,
    //                 1, 1,   0, 1,   0, 0,   1, 0
    //             ]);

    //         var triangleIndices = new Float32Array(
    //             [
    //                 0, 1, 2,   0, 2, 3,
    //                 4, 5, 6,   4, 6, 7,    
    //                 8, 9,10,   8,10,11,    
    //                12,13,14,  12,14,15,    
    //                16,17,18,  16,18,19,    
    //                20,21,22,  20,22,23
    //             ]);
                
    //         // A buffer for triangle vertices.
    //         this.trianglePosBuffer = gl.createBuffer();
    //         gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePosBuffer);
    //         gl.bufferData(gl.ARRAY_BUFFER, this.vertexPos, gl.STATIC_DRAW);
    //         this.trianglePosBuffer.itemSize = 3;
    //         this.trianglePosBuffer.numItems = 24;

    //         // A buffer for textures.
    //         this.textureBuffer = gl.createBuffer();
    //         gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    //         gl.bufferData(gl.ARRAY_BUFFER, vertexTextureCoords, gl.STATIC_DRAW);
    //         this.textureBuffer.itemSize = 2;
    //         this.textureBuffer.numItems = 24;

    //         // A buffer for indices.
    //         var indexBuffer = gl.createBuffer();
    //         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    //         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);

    //         // Set up texture.
    //         this.texture = gl.createTexture();
    //         gl.bindTexture(gl.TEXTURE_2D, this.texture);
    //         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    //         var image = new Image();

    //         function initTextureThenDraw() {
    //             image.onload = LoadTexture;
    //             image.crossOrigin = "anonymous";
    //             image.src = "https://farm6.staticflickr.com/5564/30725680942_e3bfe50e5e_b.jpg";
    //             //image.src = "https://farm6.staticflickr.com/5726/30206830053_87e9530b48_b.jpg";
    //             //window.setTimeout(draw, 200);
    //         }

    //         function LoadTexture() {
    //             gl.bindTexture(gl.TEXTURE_2D, this.texture);
    //             gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    //             gl.generateMipmap(gl.TEXTURE_2D);
    //             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    //         }

    //         initTextureThenDraw();
    //     }
    // }

    // Cube.prototype.draw = function(drawingState) {
    //     console.log("inside draw!");
    //     var gl = drawingState.gl;
    //     var modelM = twgl.m4.scaling([this.size, this.size, this.size]);
    //     twgl.m4.setTranslation(modelM, this.position, modelM);
    //     var normalM = twgl.m4.transpose(twgl.m4.inverse(twgl.m4.multiply(modelM, drawingState.view)));

    //     // Clear screen, prepare for rendering.
    //     gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //     gl.enable(gl.DEPTH_TEST);
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //     // Set up uniforms & attributes.
    //     gl.uniformMatrix4fv(shaderProgram.view, false, drawingState.camera);
    //     gl.uniformMatrix4fv(shaderProgram.proj, false, drawingState.proj);
    //     gl.uniformMatrix4fv(shaderProgram.model, false, modelM);
    //     gl.uniformMatrix4fv(shaderProgram.normalMatrix, false, normalM);
    //     gl.uniformMatrix4fv(shaderProgram.lightdir, false, drawingState.sunDirection);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePosBuffer);
    //     gl.vertexAttribPointer(shaderProgram.posAttribute, 3,
    //         gl.FLOAT, false, 0, 0);

    //     //     // CHANGE THIS TO NORMAL BUFFER
    //     // gl.bindBuffer(gl.ARRAY_BUFFER, trianglePosBuffer);
    //     // gl.vertexAttribPointer(shaderProgram.normalAttribute, trianglePosBuffer.itemSize,
    //     //     gl.FLOAT, false, 0, 0);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    //     gl.vertexAttribPointer(shaderProgram.texcoordAttribute, 3,
    //         gl.FLOAT, false, 0, 0);

    //     // Bind texture
    //     gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
    //     // Do the drawing
    //     gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
    // }

    ////////
    // constructor for Cubes
    // SpinningCube = function SpinningCube(name, position, size, color, axis) {
    //     Cube.apply(this, arguments);
    //     this.axis = axis || 'X';
    // }
    // SpinningCube.prototype = Object.create(Cube.prototype);
    // SpinningCube.prototype.draw = function (drawingState) {
    //     // we make a model matrix to place the cube in the world
    //     var modelM = twgl.m4.scaling([this.size, this.size, this.size]);
    //     var theta = Number(drawingState.realtime) / 200.0;
    //     if (this.axis == 'X') {
    //         twgl.m4.rotateX(modelM, theta, modelM);
    //     } else if (this.axis == 'Z') {
    //         twgl.m4.rotateZ(modelM, theta, modelM);
    //     } else {
    //         twgl.m4.rotateY(modelM, theta, modelM);
    //     }
    //     twgl.m4.setTranslation(modelM, this.position, modelM);
    //     // the drawing coce is straightforward - since twgl deals with the GL stuff for us
    //     var gl = drawingState.gl;
    //     gl.useProgram(shaderProgram.program);
    //     twgl.setBuffersAndAttributes(gl, shaderProgram, buffers);
    //     twgl.setUniforms(shaderProgram, {
    //         view: drawingState.view, proj: drawingState.proj, lightdir: drawingState.sunDirection,
    //         cubecolor: this.color, model: modelM
    //     });
    //     twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    // };
    // SpinningCube.prototype.center = function (drawingState) {
    //     return this.position;
    // }


})();

// put some objects into the scene
// normally, this would happen in a "scene description" file
// but I am putting it here, so that if you want to get
// rid of cubes, just don't load this file.
grobjects.push(new Cube("cube1", [-2, 0.5, 0], 1));
grobjects.push(new Cube("cube2", [2, 0.5, 0], 1, [1, 1, 0]));
grobjects.push(new Cube("cube3", [0, 0.5, -2], 1, [0, 1, 1]));
grobjects.push(new Cube("cube4", [0, 0.5, 2], 1));

// grobjects.push(new SpinningCube("scube 1", [-2, 0.5, -2], 1));
// grobjects.push(new SpinningCube("scube 2", [-2, 0.5, 2], 1, [1, 0, 0], 'Y'));
// grobjects.push(new SpinningCube("scube 3", [2, 0.5, -2], 1, [0, 0, 1], 'Z'));
// grobjects.push(new SpinningCube("scube 4", [2, 0.5, 2], 1));
