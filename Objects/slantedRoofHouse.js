var grobjects = grobjects || [];


(function () {
    "use strict";

    var vertices = new Float32Array([
        -.5, -.5, .5, .5, -.5, .5, .5, .5, .5, -.5, -.5, .5, .5, .5, .5, -.5, .5, .5,     // z = 1
        .5, -.5, -.5, .5, .5, -.5, .5, .5, .5, .5, -.5, -.5, .5, .5, .5, .5, -.5, .5,    // x = 1
        -.5, -.5, -.5, .5, -.5, -.5, .5, .5, -.5, -.5, -.5, -.5, .5, .5, -.5, -.5, .5, -.5,     // z = 0
        -.5, -.5, -.5, -.5, .5, -.5, -.5, .5, .5, -.5, -.5, -.5, -.5, .5, .5, -.5, -.5, .5,    // x = 0
        -.5, -.5, -.5, .5, -.5, -.5, .5, -.5, .5, -.5, -.5, -.5, .5, -.5, .5, -.5, -.5, .5,    // y = 0

        -.5, .5, .5, .5, 1, 0, .5, .5, .5, -.5, .5, .5, .5, 1, 0, -.5, 1, 0,
        -.5, .5, -.5, .5, 1, 0, .5, .5, -.5, -.5, .5, -.5, .5, 1, 0, -.5, 1, 0,
        -.5, .5, -.5, -.5, 1, 0, -.5, .5, .5, .5, .5, .5, .5, 1, 0, .5, .5, -.5,

    ]);

    var uvs = new Float32Array([
        // Wrap SINGLE brick texture around 4 main faces of house.
        0.0, 0.0, 0.25, 0.0, 0.25, 1.0, 0.0, 0.0, 0.25, 1.0, 0.0, 1.0,    // z = 1
        0.5, 0.0, 0.5, 1.0, 0.25, 1.0, 0.5, 0.0, 0.25, 1.0, 0.25, 0.0,    // x = 1
        0.75, 0.0, 0.5, 0.0, 0.5, 1.0, 0.75, 0.0, 0.5, 1.0, 0.75, 1.0,    // z = 0
        0.75, 0.0, 0.75, 1.0, 1.0, 1.0, 0.75, 0.0, 1.0, 1.0, 1.0, 0.0,    // x = 0
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,    // y = 0

        // Use same texture to cover rest of house. Do not stretch.
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 0.5, 1.0, 1.0, 0.0, 0.0, 0.0, 0.5, 1.0, 1.0, 0.0,

    ]);

    var normals;

    //useful util function to simplify shader creation. type is either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
    var createGLShader = function (gl, type, src) {
        var shader = gl.createShader(type)
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log("warning: shader failed to compile!")
            console.log(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    //useful util function to return a glProgram from just vertex and fragment shader source.
    var createGLProgram = function (gl, vSrc, fSrc) {
        var program = gl.createProgram();
        var vShader = createGLShader(gl, gl.VERTEX_SHADER, vSrc);
        var fShader = createGLShader(gl, gl.FRAGMENT_SHADER, fSrc);
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log("warning: program failed to link");
            return null;

        }
        return program;
    }

    //creates a gl buffer and unbinds it when done. 
    var createGLBuffer = function (gl, data, usage) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buffer;
    }

    var findAttribLocations = function (gl, program, attributes) {
        var out = {};
        for (var i = 0; i < attributes.length; i++) {
            var attrib = attributes[i];
            out[attrib] = gl.getAttribLocation(program, attrib);
        }
        return out;
    }

    var findUniformLocations = function (gl, program, uniforms) {
        var out = {};
        for (var i = 0; i < uniforms.length; i++) {
            var uniform = uniforms[i];
            out[uniform] = gl.getUniformLocation(program, uniform);
        }
        return out;
    }

    var enableLocations = function (gl, attributes) {
        for (var key in attributes) {
            var location = attributes[key];
            gl.enableVertexAttribArray(location);
        }
    }

    //always a good idea to clean up your attrib location bindings when done. You wont regret it later. 
    var disableLocations = function (gl, attributes) {
        for (var key in attributes) {
            var location = attributes[key];
            gl.disableVertexAttribArray(location);
        }
    }

    //creates a gl texture from an image object. Sometiems the image is upside down so flipY is passed to optionally flip the data.
    //it's mostly going to be a try it once, flip if you need to. 
    var createGLTexture = function (gl, image, flipY) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (flipY) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }

    var populateNormals = function () {
        normals = [];
        var v3 = twgl.v3;
        var i;
        var j;
        for (i = 8; i < vertices.length; i += 9) {
            // Vertex 3.
            var x3 = vertices[i - 2];
            var y3 = vertices[i - 1];
            var z3 = vertices[i];

            // Vertex 2.
            var x2 = vertices[i - 5];
            var y2 = vertices[i - 4];
            var z2 = vertices[i - 3];

            // Vertex 1.
            var x1 = vertices[i - 8];
            var y1 = vertices[i - 7];
            var z1 = vertices[i - 6];

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
                normals.push(normal[0]);
                normals.push(normal[1]);
                normals.push(normal[2]);
            }
        }
    }

    var SlantedRoofHouse = function (name, textureName, position, scale) {
        this.name = name;
        this.position = position || new Float32Array([0, 0, 0]);
        this.scale = scale || new Float32Array([1, 1, 1]);
        this.program = null;
        this.attributes = null;
        this.uniforms = null;
        this.buffers = [null, null]
        this.texture = null;
        this.image = LoadedImageFiles[textureName];
    }

    SlantedRoofHouse.prototype.init = function (drawingState) {
        var gl = drawingState.gl;
        populateNormals();
        var vertexSource = document.getElementById("textureVS").text;
        var fragmentSource = document.getElementById("textureFS").text;

        this.program = createGLProgram(gl, vertexSource, fragmentSource);
        this.attributes = findAttribLocations(gl, this.program, ["aPosition", "aTexCoord", "aNormal"]);
        this.uniforms = findUniformLocations(gl, this.program, ["pMatrix", "vMatrix", "mMatrix", "uTexture", "uNormalMatrix", "uLightDir"]);

        this.texture = createGLTexture(gl, this.image, true);
        //this.texture = createGLTexture(gl, this.image, false);

        this.buffers[0] = createGLBuffer(gl, vertices, gl.STATIC_DRAW);
        this.buffers[1] = createGLBuffer(gl, uvs, gl.STATIC_DRAW);
        this.buffers[2] = createGLBuffer(gl, new Float32Array(normals), gl.STATIC_DRAW);
    }

    SlantedRoofHouse.prototype.center = function () {
        return this.position;
    }

    SlantedRoofHouse.prototype.draw = function (drawingState) {
        var gl = drawingState.gl;

        gl.useProgram(this.program);
        gl.disable(gl.CULL_FACE);

        var modelM = twgl.m4.scaling([this.scale[0], this.scale[1], this.scale[2]]);
        twgl.m4.setTranslation(modelM, this.position, modelM);

        var normalMatrix = twgl.m4.transpose(twgl.m4.inverse(twgl.m4.multiply(modelM, drawingState.view)));

        gl.uniformMatrix4fv(this.uniforms.pMatrix, gl.FALSE, drawingState.proj);
        gl.uniformMatrix4fv(this.uniforms.vMatrix, gl.FALSE, drawingState.view);
        gl.uniformMatrix4fv(this.uniforms.mMatrix, gl.FALSE, modelM);
        gl.uniformMatrix4fv(this.uniforms.uNormalMatrix, gl.FALSE, normalMatrix);

        gl.uniform3fv(this.uniforms.uLightDir, drawingState.sunDirection);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uniforms.uTexture, 0);



        enableLocations(gl, this.attributes);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[0]);
        gl.vertexAttribPointer(this.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[1]);
        gl.vertexAttribPointer(this.attributes.aTexCoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[2]);
        gl.vertexAttribPointer(this.attributes.aNormal, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

        disableLocations(gl, this.attributes);
    }


    var test1 = new SlantedRoofHouse("slantedRoofHouse1", "modern_brick.jpg", [-2, 1, -2], [2, 2, 2]);

    var test2 = new SlantedRoofHouse("slantedRoofHouse2", "resized_siding.jpg", [-2, 0.5,3], [4, 1, 3]);

    grobjects.push(test1);
    grobjects.push(test2);

})();

