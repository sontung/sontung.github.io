"use strict";

function ortho( left, right, bottom, top, near, far ) {
    if ( left == right ) { throw "ortho(): left and right are equal"; }
    if ( bottom == top ) { throw "ortho(): bottom and top are equal"; }
    if ( near == far )   { throw "ortho(): near and far are equal"; }

    var w = right - left;
    var h = top - bottom;
    var d = far - near;

    var result = mat4();
    result[0][0] = 2.0 / w;
    result[1][1] = 2.0 / h;
    result[2][2] = -2.0 / d;
    result[0][3] = -(left + right) / w;
    result[1][3] = -(top + bottom) / h;
    result[2][3] = -near/d - far/d;
    return result;
}

function perspective( fovy, aspect, near, far ) {
    var f = 1.0 / Math.tan( radians(fovy) / 2 );
    var d = far - near;
    if ( near == far )   { throw "ortho(): near and far are equal"; }
    var result = mat4();
    result[0][0] = f / aspect;
    result[1][1] = f;
    result[2][2] = -near/d - far/d;
    result[2][3] = -2 * near * far / d;
    result[3][2] = -1;
    result[3][3] = 0.0;

    return result;
}

var canvas;
var gl;

var numVertices  = 36;

var numChecks = 8;

var program;

var c;

var flag = true;
var rotate_direction = 1;  // to change the direction of rotation

var pointsArray = [];
var normalsArray = [];
var colorsArray = [];


var vertices = [
  vec4( -0.5, -0.5,  0.5, 1.0 ),
  vec4( -0.5,  0.5,  0.5, 1.0 ),
  vec4( 0.5,  0.5,  0.5, 1.0 ),
  vec4( 0.5, -0.5,  0.5, 1.0 ),
  vec4( -0.5, -0.5, -0.5, 1.0 ),
  vec4( -0.5,  0.5, -0.5, 1.0 ),
  vec4( 0.5,  0.5, -0.5, 1.0 ),
  vec4( 0.5, -0.5, -0.5, 1.0 )
];

var vertexColors = [
  vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
  vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
  vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
  vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
  vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
  vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
  vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
  vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];

// to assign transformation matrices to shader
var model_view_loc;
var proj_loc;

var _left    = -5.0;
var _right   =  5.0;
var _bottom  = -5.0;
var _top     =  5.0;
var _near    = -0.5;
var _far     =  2.5;

var translation_val = [1.0, 1.0, -1.0];  // translate x and y and z
var scale_factor = 1.0;  // uniform scale
var if_ortho = true;  // true => use orthographic projection, else => use perspective projection
var if_phong = 0;  // 0 => use Phong shading, 1 => use Gouraud shading, 2 => no shading

var lightPosition = vec4(1.0, 2.0, 3.0, 1.0 );
var lightAmbient = vec4(0.1, 0.2, 0.0, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

function quad(a, b, c, d) {
   var t1 = subtract(vertices[b], vertices[a]);
   var t2 = subtract(vertices[c], vertices[b]);
   var normal = cross(t1, t2);
   var normal = vec3(normal);
   console.log(normal[0], normal[1], normal[2]);
   pointsArray.push(vertices[a]);
   colorsArray.push(vertexColors[a]);
   normalsArray.push(normal);
   pointsArray.push(vertices[b]);
   colorsArray.push(vertexColors[a]);
   normalsArray.push(normal);
   pointsArray.push(vertices[c]);
   colorsArray.push(vertexColors[a]);
   normalsArray.push(normal);
   pointsArray.push(vertices[a]);
   colorsArray.push(vertexColors[a]);
   normalsArray.push(normal);
   pointsArray.push(vertices[c]);
   colorsArray.push(vertexColors[a]);
   normalsArray.push(normal);
   pointsArray.push(vertices[d]);
   colorsArray.push(vertexColors[a]);
   normalsArray.push(normal);
}

function colorCube() {
  quad( 1, 0, 3, 2 );
  quad( 2, 3, 7, 6 );
  quad( 3, 0, 4, 7 );
  quad( 6, 5, 1, 2 );
  quad( 4, 5, 6, 7 );
  quad( 5, 4, 0, 1 );
}

window.onload = function init() {

  canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  colorCube();
  var cBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );
  
  var normalsBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, normalsBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

  var vNormal = gl.getAttribLocation( program, "vNormal" );
  gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vNormal );

  var vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  proj_loc = gl.getUniformLocation(program, "proj");
  model_view_loc = gl.getUniformLocation(program, "model_view");

  document.getElementById("ButtonX").onclick = function() {axis = xAxis;};
  document.getElementById("ButtonY").onclick = function() {axis = yAxis;};
  document.getElementById("ButtonZ").onclick = function() {axis = zAxis;};
  document.getElementById("ButtonT").onclick = function() {flag = !flag;};
  document.getElementById("ButtonProj").onclick = function() {if_ortho = !if_ortho;};
  document.getElementById("ButtonShade").onclick = function() {
    if_phong += 1;
    if (if_phong > 2) {
      if_phong = if_phong % 3;
    }
  };
  document.getElementById("ButtonChangeR").onclick = function() {
    rotate_direction *= -1;
  };
  document.getElementById("SliderTranslationX").oninput = function() {
    translation_val[0] = document.getElementById("SliderTranslationX").value;
  }
  document.getElementById("SliderTranslationY").oninput = function() {
    translation_val[1] = document.getElementById("SliderTranslationY").value;
  }
  document.getElementById("SliderTranslationZ").oninput = function() {
    translation_val[2] = document.getElementById("SliderTranslationZ").value;
  }
  document.getElementById("SliderScaling").oninput = function() {
    scale_factor = document.getElementById("SliderScaling").value;
  }
  document.getElementById("SliderNear").oninput = function() {
    _near = document.getElementById("SliderNear").value;
  }
  document.getElementById("SliderFar").oninput = function() {
    _far = document.getElementById("SliderFar").value;
  }

  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
     flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
     flatten(diffuseProduct) );
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
     flatten(specularProduct) );
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
     flatten(lightPosition) );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"),
     materialShininess);

  render();
}

var render = function() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if(flag) theta[axis] += 2.0*rotate_direction;
  gl.uniform1f(gl.getUniformLocation(program, "shade_type"), if_phong);

  // calculate transformation matrices
  var proj;
  var mat = mat4();

  if (_near == _far) {
    _far += 0.1;
  }

  if (if_ortho) {
    proj = ortho(_left, _right, _bottom, _top, _near, _far);
  } else {
    proj = perspective(45, 1.0, _near, _far);
    mat[2][3] = -1;
  }
  mat = mult(mat, translate(translation_val[0], translation_val[1], translation_val[2]));
  mat = mult(mat, rotateX(theta[0]));
  mat = mult(mat, rotateY(theta[1]));
  mat = mult(mat, rotateZ(theta[2]));
  mat = mult(mat, scalem(scale_factor, scale_factor, scale_factor));

  // forward transformation matrices to shader
  gl.uniformMatrix4fv(proj_loc, false, flatten(proj));
  gl.uniformMatrix4fv(model_view_loc, false, flatten(mat));


  gl.drawArrays( gl.TRIANGLES, 0, numVertices );
  requestAnimFrame(render);
}
