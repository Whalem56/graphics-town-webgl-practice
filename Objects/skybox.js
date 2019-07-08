var grobjects = grobjects || [];


(function () {
    "use strict";

    var vertices = new Float32Array([
        -.5,-.5,-.5,  .5,-.5,-.5,  .5, .5,-.5,        -.5,-.5,-.5,  .5, .5,-.5, -.5, .5,-.5,    // z = 0
        -.5,-.5, .5,  .5,-.5, .5,  .5, .5, .5,        -.5,-.5, .5,  .5, .5, .5, -.5, .5, .5,    // z = 1
        -.5,-.5,-.5,  .5,-.5,-.5,  .5,-.5, .5,        -.5,-.5,-.5,  .5,-.5, .5, -.5,-.5, .5,    // y = 0
        -.5, .5,-.5,  .5, .5,-.5,  .5, .5, .5,        -.5, .5,-.5,  .5, .5, .5, -.5, .5, .5,    // y = 1
        -.5,-.5,-.5, -.5, .5,-.5, -.5, .5, .5,        -.5,-.5,-.5, -.5, .5, .5, -.5,-.5, .5,    // x = 0
         .5,-.5,-.5,  .5, .5,-.5,  .5, .5, .5,         .5,-.5,-.5,  .5, .5, .5,  .5,-.5, .5     // x = 1
    ]);

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
    var createGLTexture = function (gl, images, flipY) {
        // var texture = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, texture);
        // if (flipY) {
        //     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // }
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.generateMipmap(gl.TEXTURE_2D);
        // gl.bindTexture(gl.TEXTURE_2D, null);
        // return texture;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
         if (flipY) {
             gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[0]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[1]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[2]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[3]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[4]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[5]);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        return texture;
    }

    var Skybox = function (name, images, position, scale) {
        this.name = name;
        this.position = position || new Float32Array([0, 0, 0]);
        this.scale = scale || new Float32Array([1, 1, 1]);
        this.program = null;
        this.attributes = null;
        this.uniforms = null;
        this.buffers = [null];
        this.texture = null;
        this.images = images;
    }

    Skybox.prototype.init = function (drawingState) {
        var gl = drawingState.gl;

        var vertexSource = document.getElementById("skyboxVS").text;
        var fragmentSource = document.getElementById("skyboxFS").text;

        this.program = createGLProgram(gl, vertexSource, fragmentSource);
        this.attributes = findAttribLocations(gl, this.program, ["aPosition"]);
        this.uniforms = findUniformLocations(gl, this.program, ["pMatrix", "vMatrix", "mMatrix", "uSkybox"]);

        this.texture = createGLTexture(gl, this.images, false);

        this.buffers[0] = createGLBuffer(gl, vertices, gl.STATIC_DRAW);
    }

    Skybox.prototype.center = function () {
        return this.position;
    }

    Skybox.prototype.draw = function (drawingState) {
        var gl = drawingState.gl;

        gl.useProgram(this.program);
        gl.disable(gl.CULL_FACE);

        var modelM = twgl.m4.scaling([this.scale[0], this.scale[1], this.scale[2]]);
        twgl.m4.setTranslation(modelM, drawingState.position, modelM);

        gl.uniformMatrix4fv(this.uniforms.pMatrix, gl.FALSE, drawingState.proj);
        gl.uniformMatrix4fv(this.uniforms.vMatrix, gl.FALSE, drawingState.view);
        gl.uniformMatrix4fv(this.uniforms.mMatrix, gl.FALSE, modelM);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        gl.uniform1i(this.uniforms.uSkybox, 0);


        enableLocations(gl, this.attributes);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[0]);
        gl.vertexAttribPointer(this.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

        disableLocations(gl, this.attributes);
    }


    var skyboxTextures = [];     

    skyboxTextures[0] = LoadedImageFiles["positive_x.jpg"];
    skyboxTextures[1] = LoadedImageFiles["negative_x.jpg"];
    skyboxTextures[2] = LoadedImageFiles["positive_y.jpg"];
    skyboxTextures[3] = LoadedImageFiles["negative_y.jpg"];
    skyboxTextures[4] = LoadedImageFiles["negative_z.jpg"];
    skyboxTextures[5] = LoadedImageFiles["positive_z.jpg"];

    var test1 = new Skybox("skybox1", skyboxTextures, [0, 0, 0], [100, 100, 100]);

    grobjects.push(test1);

})();

