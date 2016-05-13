var canvas;
var gl;

var yAxis;
var xAxis;
var mvMatrix;
var shaderProgram;
var perspectiveMatrix;

var displayQueue = new Array(); //holds the points we want to display and the timestamp


//returns DataPoint object that stores value and timestamp
function DataPoint() {
  self.timestamp = null;
  self.value = null; //data value
  self.buffer = null; //gl buffer
  self.vertexAttribPointer = undefined; //gl vertexAttrPtr
  self.xpos = null;
  self.ypos = null;
  self.zpos = null;
}

function Axis() {
  self.gl_buffer = null;
  self.gl_vertexAttribPointer = null;
  self.gl_line_start = 0;
  self.gl_line_length = 0;
  self.maxValue = 0;
  self.minValue = 0;
  self.range = 0;
}


function start() {
  canvas = document.getElementById("glcanvas");

  initWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.

      initAxisBuffers();

    // Set up to draw the scene periodically.

    setInterval(drawScene, 15);
  }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//maxGLWindowPos
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

//push data point to front of display queue
function pushData(value) {
  var newDataPoint = new DataPoint();
  newDataPoint.value = value;
  newDataPoint.timestamp = Date.now(); //ms
  displayQueue.push(newDataPoint);
  initDataBuffers(newDataPoint);
}


//a small square
var PointVertices = [
    0.0, 0.03, 0,
    0.03, 0.03, 0,
    0.0, 0.0, 0,
    0.03, 0, 0];

function initDataBuffers(mDataPoint) {
  displayQueue[displayQueue.length - 1].buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, displayQueue[displayQueue.length - 1].buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PointVertices), gl.STATIC_DRAW);
}

function initAxisBuffers() {

  yAxis = new Axis();
  yAxis.gl_line_length = -2;
  yAxis.gl_line_start = 2;

  yAxis.minValue = 0;
  yAxis.maxValue = 10;
  yAxis.range = yAxis.maxValue - yAxis.minValue;

  yAxis.gl_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, yAxis.gl_buffer);

  var y_axis_vertices = [
    -2.98,  2.0,  0.0,
    -3.0, 2.0,  0.0,
    -2.98, -2.1, 0.0,
    -3.0, -2.1, 0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(y_axis_vertices), gl.STATIC_DRAW);

  //----------------------- draw X axis -----------------------

  xAxis = new Axis();
  xAxis.gl_line_length = 6;
  xAxis.gl_line_start = 3;

  xAxis.minValue = 0;
  xAxis.maxValue = 20000; //ms
  xAxis.range = xAxis.maxValue - xAxis.minValue;
  xAxis.gl_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, xAxis.gl_buffer);

  var x_axis_vertices = [
    xAxis.gl_line_start,  -1.98,  0.0,
    xAxis.gl_line_start, -2.0,  0.0,
    xAxis.gl_line_start-xAxis.gl_line_length - 0.2, -2.0, 0.0,
    xAxis.gl_line_start-xAxis.gl_line_length - 0.2, -1.98, 0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(x_axis_vertices), gl.STATIC_DRAW);

}

function drawScene() {
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.

  loadIdentity();

  // Now move the drawing position a bit to where we want to start
  // drawing the square.

  mvTranslate([0.0, 0.0, -6.0]);

  // Draw the y axis by binding the array buffer to the square's vertices
  // array, setting attributes, and pushing it to GL.


  gl.bindBuffer(gl.ARRAY_BUFFER, yAxis.gl_buffer);
  gl.vertexAttribPointer(yAxis.gl_vertexAttribPointer, 3, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.bindBuffer(gl.ARRAY_BUFFER, xAxis.gl_buffer);
  gl.vertexAttribPointer(xAxis.gl_vertexAttribPointer, 3, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  //set starting location to be the furthest right point on the x axis
  mvTranslate([xAxis.gl_line_start, yAxis.gl_line_length, 0.0]);
  for(var pos = 0; pos < displayQueue.length; pos++) {
    var for_debugging = displayQueue[pos];

    //move drawing position to scaled position
    //TODO: This equation needs to be modified for when yAxis.minValue is not 0
    var dataYTranslate = displayQueue[pos].value / (yAxis.maxValue - yAxis.minValue) * (yAxis.gl_line_start - yAxis.gl_line_length);
    
    xAxis.maxValue = Date.now(); //time elapsed since the start of the test
    xAxis.minValue = xAxis.maxValue - xAxis.range;

    if(displayQueue[pos].timestamp < xAxis.minValue) {
        displayQueue.shift();
        pos--;
        continue;
    }

    var dataXTranslate = ((xAxis.maxValue - displayQueue[pos].timestamp) / xAxis.range) * xAxis.gl_line_length;
    mvTranslate([-dataXTranslate, dataYTranslate, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, displayQueue[pos].buffer);
    gl.vertexAttribPointer(displayQueue[pos].vertexAttribPointer, 3, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //reset draw position
    mvTranslate([dataXTranslate, -dataYTranslate, 0]);
  }
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.

  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object

  gl.shaderSource(shader, theSource);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}