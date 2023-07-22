/* eslint-disable no-bitwise */
/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable no-plusplus */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], () => {
      return factory.call(root);
    });
  } else {
    root.webglUtils = factory.call(root);
  }
})(this, function () {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const topWindow = this;

  /**
   * Wrapped logging function.
   * @param {string} msg The message to log.
   */
  function error(msg) {
    if (topWindow.console) {
      if (topWindow.console.error) {
        topWindow.console.error(msg);
      } else if (topWindow.console.log) {
        topWindow.console.log(msg);
      }
    }
  }

  /**
   *
   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {string} shaderSource  The shader source.
   * @param {number} shaderType
   * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors.
   * @return {WebGLShader} The created shader.
   */
  function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
    const errFn = opt_errorCallback || error;

    // Create the shader object
    const shader = gl.createShader(shaderType);

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Complie the shader
    gl.compileShader(shader);

    // Check the complie status
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      // Something went wrong during compilation; get the error
      const lastError = gl.getShaderInfoLog(shader);
      errFn(
        `*** Error compiling shader '${shader}':${lastError}\n${shaderSource
          .split('\n')
          .map((l, i) => `${i + 1}: ${l}`)
          .join('\n')}`
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   *
   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {string} scriptId The id of the script tag.
   * @param {number} opt_shaderType The type of shader. If not passed in it will
   *     be derived from the type of the script tag.
   * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors.
   * @returns {WebGLShader} The created shader.
   */
  function createShaderFromScript(gl, scriptId, opt_shaderType, opt_errorCallback) {
    const shaderScript = document.querySelector(`#${scriptId}`);
    if (!shaderScript) {
      throw new Error(`*** Error: unknown script element ${scriptId}`);
    }

    const shaderSource = shaderScript.textContent;

    let shaderType;
    if (!opt_shaderType) {
      if (shaderScript.type === 'x-shader/x-vertex') {
        shaderType = gl.VERTEX_SHADER;
      } else if (shaderScript.type === 'x-shader/x-fragment') {
        shaderType = gl.FRAGMENT_SHADER;
      } else {
        throw new Error('*** Error: unknown shader type');
      }
    }

    return loadShader(gl, shaderSource, opt_shaderType || shaderType, opt_errorCallback);
  }

  /**
   * Creates a program, attaches shaders, binds attrib locations, links the
   * program and calls useProgram.
   * @param {WebGLRenderingContext} gl
   * @param {WebGLShader[]} shaders The shaders to attach
   * @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
   * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
   * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
   *        on error. If you want something else pass an callback. It's passed an error message.
   * @memberOf module:webgl-utils
   */
  function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
    const errFn = opt_errorCallback ?? error;
    const program = gl.createProgram();

    shaders.forEach((shader) => {
      gl.attachShader(program, shader);
    });

    if (opt_attribs) {
      opt_attribs.forEach((attrib, index) => {
        gl.bindAttribLocation(program, opt_locations ? opt_locations[index] : index, attrib);
      });
    }
    gl.linkProgram(program);

    // Check the link status
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      const lastError = gl.getProgramInfoLog(program);
      errFn(`Error in program linking:${lastError}`);

      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  const defaultShaderType = ['VERTEX_SHADER', 'FRAGMENT_SHADER'];

  /**
   *
   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use
   * @param {string[]} shaderScriptIds Array of ids of the script tags for the shaders.
   *        The first is assumed to be the vertex shader, the second the fragment shader.
   * @param {string[]} [opt_attribs]  An array of attribs names.
   *        Locations will be assigned by index if not passed in
   * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs
   *        letting you assign locations.
   * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
   *        on error. If you want something else pass an callback. It's passed an error message.
   * @returns {WebGLProgram}
   */
  function createProgramFromScripts(gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
    const shaders = [];
    for (let i = 0; i < shaderScriptIds.length; i++) {
      shaders.push(createShaderFromScript(gl, shaderScriptIds[i], gl[defaultShaderType[i]], opt_errorCallback));
    }

    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
  }

  /**
   * Resize a canvas to match the size its displayed.
   * @param {HTMLCanvasElement} canvas The canvas to resize.
   * @param {number} [multiplier] amount to multiply by.
   *    Pass in window.devicePixelRatio for native pixels.
   * @return {boolean} true if the canvas was resized.
   * @memberOf module:webgl-utils
   */
  function resizeCanvasToDisplaySize(canvas, multiplier) {
    multiplier = multiplier || 1;
    const width = (canvas.clientWidth * multiplier) | 0;
    const height = (canvas.clientHeight * multiplier) | 0;

    if (multiplier !== 1) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }

    return false;
  }

  return {
    createProgramFromScripts,
    resizeCanvasToDisplaySize,
  };
});
