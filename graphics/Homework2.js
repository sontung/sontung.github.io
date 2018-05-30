"use strict";
//
// HELPER FUNCTIONS
//
function identity(dst) {
  dst = dst || new Float32Array(16);

  dst[ 0] = 1;
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 1;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;

  return dst;
};

function perspective(fieldOfViewInRadians, aspect, near, far, dst) {
  dst = dst || new Float32Array(16);
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  dst[ 0] = f / aspect;
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = f;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = (near + far) * rangeInv;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far * rangeInv * 2;
  dst[15] = 0;

  return dst;
};

function lookAt(cameraPosition, target, up, dst) {
  dst = dst || new Float32Array(16);
  var zAxis = normalize(subtractVectors(cameraPosition, target));
  var xAxis = normalize(cross(up, zAxis));
  var yAxis = normalize(cross(zAxis, xAxis));

  dst[ 0] = xAxis[0];
  dst[ 1] = xAxis[1];
  dst[ 2] = xAxis[2];
  dst[ 3] = 0;
  dst[ 4] = yAxis[0];
  dst[ 5] = yAxis[1];
  dst[ 6] = yAxis[2];
  dst[ 7] = 0;
  dst[ 8] = zAxis[0];
  dst[ 9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = cameraPosition[0];
  dst[13] = cameraPosition[1];
  dst[14] = cameraPosition[2];
  dst[15] = 1;

  return dst;
};

function normalize(v, dst) {
  dst = dst || new Float32Array(3);
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    dst[0] = v[0] / length;
    dst[1] = v[1] / length;
    dst[2] = v[2] / length;
  }
  return dst;
};

function subtractVectors(a, b, dst) {
  dst = dst || new Float32Array(3);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  return dst;
};

function cross(a, b, dst) {
  dst = dst || new Float32Array(3);
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = a[2] * b[0] - a[0] * b[2];
  dst[2] = a[0] * b[1] - a[1] * b[0];
  return dst;
};

function inverse(m, dst) {
  dst = dst || new Float32Array(16);
  var m00 = m[0 * 4 + 0];
  var m01 = m[0 * 4 + 1];
  var m02 = m[0 * 4 + 2];
  var m03 = m[0 * 4 + 3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var m30 = m[3 * 4 + 0];
  var m31 = m[3 * 4 + 1];
  var m32 = m[3 * 4 + 2];
  var m33 = m[3 * 4 + 3];
  var tmp_0  = m22 * m33;
  var tmp_1  = m32 * m23;
  var tmp_2  = m12 * m33;
  var tmp_3  = m32 * m13;
  var tmp_4  = m12 * m23;
  var tmp_5  = m22 * m13;
  var tmp_6  = m02 * m33;
  var tmp_7  = m32 * m03;
  var tmp_8  = m02 * m23;
  var tmp_9  = m22 * m03;
  var tmp_10 = m02 * m13;
  var tmp_11 = m12 * m03;
  var tmp_12 = m20 * m31;
  var tmp_13 = m30 * m21;
  var tmp_14 = m10 * m31;
  var tmp_15 = m30 * m11;
  var tmp_16 = m10 * m21;
  var tmp_17 = m20 * m11;
  var tmp_18 = m00 * m31;
  var tmp_19 = m30 * m01;
  var tmp_20 = m00 * m21;
  var tmp_21 = m20 * m01;
  var tmp_22 = m00 * m11;
  var tmp_23 = m10 * m01;

  var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
  (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
  var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
  (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
  var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
  (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
  var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
  (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

  var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

  dst[0] = d * t0;
  dst[1] = d * t1;
  dst[2] = d * t2;
  dst[3] = d * t3;
  dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
  (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
  dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
  (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
  dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
  (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
  dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
  (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
  dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
  (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
  dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
  (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
  dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
  (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
  dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
  (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
  dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
  (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
  dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
  (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
  dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
  (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
  dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
  (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

  return dst;
};

function multiply(a, b, dst) {
  dst = dst || new Float32Array(16);
  var b00 = b[0 * 4 + 0];
  var b01 = b[0 * 4 + 1];
  var b02 = b[0 * 4 + 2];
  var b03 = b[0 * 4 + 3];
  var b10 = b[1 * 4 + 0];
  var b11 = b[1 * 4 + 1];
  var b12 = b[1 * 4 + 2];
  var b13 = b[1 * 4 + 3];
  var b20 = b[2 * 4 + 0];
  var b21 = b[2 * 4 + 1];
  var b22 = b[2 * 4 + 2];
  var b23 = b[2 * 4 + 3];
  var b30 = b[3 * 4 + 0];
  var b31 = b[3 * 4 + 1];
  var b32 = b[3 * 4 + 2];
  var b33 = b[3 * 4 + 3];
  var a00 = a[0 * 4 + 0];
  var a01 = a[0 * 4 + 1];
  var a02 = a[0 * 4 + 2];
  var a03 = a[0 * 4 + 3];
  var a10 = a[1 * 4 + 0];
  var a11 = a[1 * 4 + 1];
  var a12 = a[1 * 4 + 2];
  var a13 = a[1 * 4 + 3];
  var a20 = a[2 * 4 + 0];
  var a21 = a[2 * 4 + 1];
  var a22 = a[2 * 4 + 2];
  var a23 = a[2 * 4 + 3];
  var a30 = a[3 * 4 + 0];
  var a31 = a[3 * 4 + 1];
  var a32 = a[3 * 4 + 2];
  var a33 = a[3 * 4 + 3];
  dst[ 0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
  dst[ 1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
  dst[ 2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
  dst[ 3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
  dst[ 4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
  dst[ 5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
  dst[ 6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
  dst[ 7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
  dst[ 8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
  dst[ 9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
  dst[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
  dst[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
  dst[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
  dst[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
  dst[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
  dst[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  return dst;
};

function translation(tx, ty, tz, dst) {
  dst = dst || new Float32Array(16);

  dst[ 0] = 1;
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 1;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = tx;
  dst[13] = ty;
  dst[14] = tz;
  dst[15] = 1;

  return dst;
};

function xRotate(m, angleInRadians, dst) {
  // this is the optimized version of
  // return multiply(m, xRotation(angleInRadians), dst);
  dst = dst || new Float32Array(16);

  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  dst[4]  = c * m10 + s * m20;
  dst[5]  = c * m11 + s * m21;
  dst[6]  = c * m12 + s * m22;
  dst[7]  = c * m13 + s * m23;
  dst[8]  = c * m20 - s * m10;
  dst[9]  = c * m21 - s * m11;
  dst[10] = c * m22 - s * m12;
  dst[11] = c * m23 - s * m13;

  if (m !== dst) {
    dst[ 0] = m[ 0];
    dst[ 1] = m[ 1];
    dst[ 2] = m[ 2];
    dst[ 3] = m[ 3];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }

  return dst;
};

function yRotate(m, angleInRadians, dst) {
  // this is the optimized verison of
  // return multiply(m, yRotation(angleInRadians), dst);
  dst = dst || new Float32Array(16);

  var m00 = m[0 * 4 + 0];
  var m01 = m[0 * 4 + 1];
  var m02 = m[0 * 4 + 2];
  var m03 = m[0 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  dst[ 0] = c * m00 - s * m20;
  dst[ 1] = c * m01 - s * m21;
  dst[ 2] = c * m02 - s * m22;
  dst[ 3] = c * m03 - s * m23;
  dst[ 8] = c * m20 + s * m00;
  dst[ 9] = c * m21 + s * m01;
  dst[10] = c * m22 + s * m02;
  dst[11] = c * m23 + s * m03;

  if (m !== dst) {
    dst[ 4] = m[ 4];
    dst[ 5] = m[ 5];
    dst[ 6] = m[ 6];
    dst[ 7] = m[ 7];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }

  return dst;
};

function zRotate(m, angleInRadians, dst) {
  // This is the optimized verison of
  // return multiply(m, zRotation(angleInRadians), dst);
  dst = dst || new Float32Array(16);

  var m00 = m[0 * 4 + 0];
  var m01 = m[0 * 4 + 1];
  var m02 = m[0 * 4 + 2];
  var m03 = m[0 * 4 + 3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  dst[ 0] = c * m00 + s * m10;
  dst[ 1] = c * m01 + s * m11;
  dst[ 2] = c * m02 + s * m12;
  dst[ 3] = c * m03 + s * m13;
  dst[ 4] = c * m10 - s * m00;
  dst[ 5] = c * m11 - s * m01;
  dst[ 6] = c * m12 - s * m02;
  dst[ 7] = c * m13 - s * m03;

  if (m !== dst) {
    dst[ 8] = m[ 8];
    dst[ 9] = m[ 9];
    dst[10] = m[10];
    dst[11] = m[11];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }

  return dst;
};

function scale(m, sx, sy, sz, dst) {
  // This is the optimized verison of
  // return multiply(m, scaling(sx, sy, sz), dst);
  dst = dst || new Float32Array(16);

  dst[ 0] = sx * m[0 * 4 + 0];
  dst[ 1] = sx * m[0 * 4 + 1];
  dst[ 2] = sx * m[0 * 4 + 2];
  dst[ 3] = sx * m[0 * 4 + 3];
  dst[ 4] = sy * m[1 * 4 + 0];
  dst[ 5] = sy * m[1 * 4 + 1];
  dst[ 6] = sy * m[1 * 4 + 2];
  dst[ 7] = sy * m[1 * 4 + 3];
  dst[ 8] = sz * m[2 * 4 + 0];
  dst[ 9] = sz * m[2 * 4 + 1];
  dst[10] = sz * m[2 * 4 + 2];
  dst[11] = sz * m[2 * 4 + 3];

  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }

  return dst;
};

function copy(src, dst) {
  dst = dst || new Float32Array(16);

  dst[ 0] = src[ 0];
  dst[ 1] = src[ 1];
  dst[ 2] = src[ 2];
  dst[ 3] = src[ 3];
  dst[ 4] = src[ 4];
  dst[ 5] = src[ 5];
  dst[ 6] = src[ 6];
  dst[ 7] = src[ 7];
  dst[ 8] = src[ 8];
  dst[ 9] = src[ 9];
  dst[10] = src[10];
  dst[11] = src[11];
  dst[12] = src[12];
  dst[13] = src[13];
  dst[14] = src[14];
  dst[15] = src[15];

  return dst;
};
//
// END HELPER FUNCTIONS
//
var TRS = function() {
  this.translation = [0, 0, 0];
  this.rotation = [0, 0, 0];
  this.scale = [1, 1, 1];
};

TRS.prototype.getMatrix = function(dst) {
  dst = dst || new Float32Array(16);
  var t = this.translation;
  var r = this.rotation;
  var s = this.scale;
  translation(t[0], t[1], t[2], dst);
  xRotate(dst, r[0], dst);
  yRotate(dst, r[1], dst);
  zRotate(dst, r[2], dst);
  scale(dst, s[0], s[1], s[2], dst);
  return dst;
};

var Node = function(source) {
  this.children = [];
  this.localMatrix = identity();
  this.worldMatrix = identity();
  this.source = source;
};

Node.prototype.setParent = function(parent) {
  // remove us from our parent
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // Add us to our new parent
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {

  var source = this.source;
  if (source) {
    source.getMatrix(this.localMatrix);
  }

  if (parentWorldMatrix) {
    // a matrix was passed in so do the math
    multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
  } else {
    // no matrix was passed in so just copy local to world
    copy(this.localMatrix, this.worldMatrix);
  }

  // now process all the children
  var worldMatrix = this.worldMatrix
  this.children.forEach(function(child) {
    child.updateWorldMatrix(worldMatrix);
  });
};



function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  };

  var createFlattenedVertices = function(gl, vertices) {
    function makeRandomVertexColors(vertices, options) {
      options = options || {};
      var numElements = vertices.position.numElements;
      var vcolors = webglUtils.createAugmentedTypedArray(4, numElements, Uint8Array);
      var ii;
      var rand = options.rand || function(ndx, channel) {
        return channel < 3 ? randInt(256) : 255;
      };
      vertices.color = vcolors;
      if (vertices.indices) {
        // just make random colors if index
        for (ii = 0; ii < numElements; ++ii) {
          vcolors.push(rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3));
        }
      } else {
        // make random colors per triangle
        var numVertsPerColor = options.vertsPerColor || 3;
        var numSets = numElements / numVertsPerColor;
        for (ii = 0; ii < numSets; ++ii) {
          var color = [rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3)];
          for (var jj = 0; jj < numVertsPerColor; ++jj) {
            vcolors.push(color);
          }
        }
      }
      return vertices;
    };

    function deindexVertices(vertices) {
      var indices = vertices.indices;
      var newVertices = {};
      var numElements = indices.length;

      function allButIndices(name) {
        return name !== "indices";
      }

      function expandToUnindexed(channel) {
        var srcBuffer = vertices[channel];
        var numComponents = srcBuffer.numComponents;
        var dstBuffer = webglUtils.createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
        for (var ii = 0; ii < numElements; ++ii) {
          var ndx = indices[ii];
          var offset = ndx * numComponents;
          for (var jj = 0; jj < numComponents; ++jj) {
            dstBuffer.push(srcBuffer[offset + jj]);
          }
        }
        newVertices[channel] = dstBuffer;
      }

      Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);

      return newVertices;
    };

    var last;
    return webglUtils.createBufferInfoFromArrays(gl, makeRandomVertexColors(deindexVertices(vertices),
      {
        vertsPerColor: 1,
        rand: function(ndx, channel) {
          if (channel == 0) {
            last = 128 + Math.random() * 128 | 0;
          }
          return channel < 3 ? last : 255;
        }
      })
    );
  };

  var createCubeVertices = function(size) {
    var k = size / 2;

    var CUBE_FACE_INDICES = [
      [3, 7, 5, 1], // right
      [6, 2, 0, 4], // left
      [6, 7, 3, 2], // ??
      [0, 1, 5, 4], // ??
      [7, 6, 4, 5], // front
      [2, 3, 1, 0], // back
    ];

    var cornerVertices = [
      [-k, -k, -k],
      [+k, -k, -k],
      [-k, +k, -k],
      [+k, +k, -k],
      [-k, -k, +k],
      [+k, -k, +k],
      [-k, +k, +k],
      [+k, +k, +k],
    ];

    var faceNormals = [
      [+1, +0, +0],
      [-1, +0, +0],
      [+0, +1, +0],
      [+0, -1, +0],
      [+0, +0, +1],
      [+0, +0, -1],
    ];

    var uvCoords = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];

    var numVertices = 6 * 4;
    var positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    var normals   = webglUtils.createAugmentedTypedArray(3, numVertices);
    var texCoords = webglUtils.createAugmentedTypedArray(2 , numVertices);
    var indices   = webglUtils.createAugmentedTypedArray(3, 6 * 2, Uint16Array);

    for (var f = 0; f < 6; ++f) {
      var faceIndices = CUBE_FACE_INDICES[f];
      for (var v = 0; v < 4; ++v) {
        var position = cornerVertices[faceIndices[v]];
        var normal = faceNormals[f];
        var uv = uvCoords[v];

        // Each face needs all four vertices because the normals and texture
        // coordinates are not all the same.
        positions.push(position);
        normals.push(normal);
        texCoords.push(uv);

      }
      // Two triangles make a square face.
      var offset = 4 * f;
      indices.push(offset + 0, offset + 1, offset + 2);
      indices.push(offset + 0, offset + 2, offset + 3);
    }

    return {
      position: positions,
      normal: normals,
      texcoord: texCoords,
      indices: indices,
    };
  };

  var cubeBufferInfo = createFlattenedVertices(gl, createCubeVertices(1));

  // setup GLSL program
  var programInfo = webglUtils.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

  function degToRad(d) {
    return d * Math.PI / 180;
  };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  };

  function emod(x, n) {
    return x >= 0 ? (x % n) : ((n - (-x % n)) % n);
  };

  function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  };

  function quad() {
    var i;
    for (i = 0; i < 6; i++) {
       texCoordsArray.push(texCoord[0]);

       texCoordsArray.push(texCoord[1]);

       texCoordsArray.push(texCoord[2]);

       texCoordsArray.push(texCoord[0]);

       texCoordsArray.push(texCoord[2]);

       texCoordsArray.push(texCoord[3]);
    }
  };

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(60);
  var cameraHeight = 50;

  var objectsToDraw = [];
  var objects = [];
  var nodeInfosByName = {};

  var texture1, texture2;
  var texSize = 256;
  var numChecks = 8;
  var c;
  var image1 = new Uint8Array(4*texSize*texSize);

  for ( var i = 0; i < texSize; i++ ) {
      for ( var j = 0; j <texSize; j++ ) {
          var patchx = Math.floor(i/(texSize/numChecks));
          var patchy = Math.floor(j/(texSize/numChecks));
          if(patchx%2 ^ patchy%2) c = 255;
          else c = 0;
          //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
          image1[4*i*texSize+4*j] = c;
          image1[4*i*texSize+4*j+1] = c;
          image1[4*i*texSize+4*j+2] = c;
          image1[4*i*texSize+4*j+3] = 255;
      }
  }

  var image2 = new Uint8Array(4*texSize*texSize);

  // Create a checkerboard pattern
  for ( var i = 0; i < texSize; i++ ) {
      for ( var j = 0; j <texSize; j++ ) {
          image2[4*i*texSize+4*j] = 127+127*Math.sin(0.1*i*j);
          image2[4*i*texSize+4*j+1] = 127+127*Math.sin(0.1*i*j);
          image2[4*i*texSize+4*j+2] = 127+127*Math.sin(0.1*i*j);
          image2[4*i*texSize+4*j+3] = 255;
      }
  }

  // Let's make all the nodes
  var blockGuyNodeDescriptions =
  {
    name: "point between feet",
    draw: false,
    children: [
      {
        name: "body_p",
        draw: false,
        children: [
          {
            name: "body",
            translation: [0, 3, 0]
          },
          {
            name: "head_p",
            draw: false,
            children: [{name: "head", translation: [2, 5, 0]}]
          },
          {
            name: "tail_p",
            draw: false,
            children: [{name: "tail", translation: [-3, 5, 0]}]
          },
          {
            name: "foot1_p",
            draw: false,
            children: [{name: "foot1", translation: [1.9, 1, 0], children: [{name: "foot11", translation: [0, -1, 0]}]}]
          },
          {
            name: "foot2_p",
            draw: false,
            children: [{name: "foot2", translation: [1, 1, 0], children: [{name: "foot21", translation: [0, -1, 0]}]}]
          },
          {
            name: "foot3_p",
            draw: false,
            children: [{name: "foot3", translation: [-1, 1, 0], children: [{name: "foot31", translation: [0, -1, 0]}]}]
          },
          {
            name: "foot4_p",
            draw: false,
            children: [{name: "foot4", translation: [-1.9, 1, 0], children: [{name: "foot41", translation: [0, -1, 0]}]}]
          }
        ]
      }
    ]
  }

  function makeNode(nodeDescription) {
    var trs  = new TRS();
    var node = new Node(trs);
    nodeInfosByName[nodeDescription.name] = {
      trs: trs,
      node: node,
    };
    trs.translation = nodeDescription.translation || trs.translation;
    if (nodeDescription.draw !== false) {
      node.drawInfo = {
        uniforms: {
          u_colorOffset: [0, 0, 0.6, 0],
          u_colorMult: [0.4, 0.4, 0.4, 1],
        },
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
      };
      objectsToDraw.push(node.drawInfo);
      objects.push(node);
    }
    makeNodes(nodeDescription.children).forEach(function(child) {
      child.setParent(node);
    });
    return node;
  };

  function makeNodes(nodeDescriptions) {
    return nodeDescriptions ? nodeDescriptions.map(makeNode) : [];
  };

  var scene = makeNode(blockGuyNodeDescriptions);

  var texCoordsArray = new Float32Array([0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0]);
  var tBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, texCoordsArray, gl.STATIC_DRAW );

  var vTexCoord = gl.getAttribLocation( programInfo.program, "vTexCoord" );
  gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vTexCoord );

  configureTexture();
  gl.activeTexture( gl.TEXTURE0 );
  gl.bindTexture( gl.TEXTURE_2D, texture1 );
  gl.uniform1i(gl.getUniformLocation( programInfo.program, "Tex0"), 0);

  gl.activeTexture( gl.TEXTURE1 );
  gl.bindTexture( gl.TEXTURE_2D, texture2 );
  gl.uniform1i(gl.getUniformLocation( programInfo.program, "Tex1"), 1);
  requestAnimationFrame(render);

  var sign1 = 1;
  var sign2 = 1;
  var sign3 = -1;
  var sign4 = -1;
  var max_val;
  var index;
  var ifAnimated = false;
  document.getElementById("ButtonX").onclick = function() {ifAnimated = !ifAnimated;};

  // Draw the scene.
  function render(time) {
    var time_raw = time;
    time *= 0.001;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 10, 20];
    var target = [0, 3.5, 0];
    var up = [0, 2, 0];
    var cameraMatrix = lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = inverse(cameraMatrix);

    var viewProjectionMatrix = multiply(projectionMatrix, viewMatrix);

    // Draw objects

    // Update all world matrices in the scene graph
    scene.updateWorldMatrix();

    nodeInfosByName["body"].trs.scale =  [5, 3, 1];
    nodeInfosByName["head"].trs.scale =  [1.5, 1.5, 1];
    nodeInfosByName["foot1"].trs.scale =  [0.75, 1.5, 0.75];
    nodeInfosByName["foot2"].trs.scale =  [0.75, 1.5, 0.75];
    nodeInfosByName["foot3"].trs.scale =  [0.75, 1.5, 0.75];
    nodeInfosByName["foot4"].trs.scale =  [0.75, 1.5, 0.75];
    nodeInfosByName["foot11"].trs.scale =  [1, 2, 1];
    nodeInfosByName["foot21"].trs.scale =  [1, 2, 1];
    nodeInfosByName["foot31"].trs.scale =  [1, 2, 1];
    nodeInfosByName["foot41"].trs.scale =  [1, 2, 1];
    nodeInfosByName["tail"].trs.scale =  [0.75, 3, 0.75];
    nodeInfosByName["tail"].trs.rotation[2] =  1;

    if (ifAnimated) {
      var speed = 0.01;
      var c = time * speed;

      if (nodeInfosByName["body_p"].trs.translation[0] >= 20) {
        nodeInfosByName["body_p"].trs.translation[0] = -20;
      }

      nodeInfosByName["body_p"].trs.translation[0] += c;

      console.log(nodeInfosByName["body_p"].trs.translation[0]);

      max_val = 0.2;
      index = 1;
      if (nodeInfosByName["head"].trs.rotation[index] >= max_val) {
        sign1 = -1;
      } else if (nodeInfosByName["head"].trs.rotation[index] <= - max_val) {
        sign1 = 1;
      }
      nodeInfosByName["head"].trs.rotation[index] += sign1*0.01;

      max_val = 0.5;
      index = 0;
      if (nodeInfosByName["tail"].trs.rotation[index] >= max_val) {
        sign4 = -1;
      } else if (nodeInfosByName["tail"].trs.rotation[index] <= - max_val) {
        sign4 = 1;
      }
      nodeInfosByName["tail"].trs.rotation[index] += sign4*0.01;

      max_val = 0.2;
      if (nodeInfosByName["foot1"].trs.rotation[2] >= max_val) {
        sign2 = -1;
      } else if (nodeInfosByName["foot1"].trs.rotation[2] <= - max_val) {
        sign2 = 1;
      }
      nodeInfosByName["foot1"].trs.rotation[2] += sign2*0.01;


      max_val = 0.2;
      if (nodeInfosByName["foot2"].trs.rotation[2] >= max_val) {
        sign2 = -1;
      } else if (nodeInfosByName["foot2"].trs.rotation[2] <= - max_val) {
        sign2 = 1;
      }
      nodeInfosByName["foot2"].trs.rotation[2] += sign2*0.01;

      max_val = 0.2;
      if (nodeInfosByName["foot3"].trs.rotation[2] >= max_val) {
        sign3 = -1;
      } else if (nodeInfosByName["foot3"].trs.rotation[2] <= - max_val) {
        sign3 = 1;
      }
      nodeInfosByName["foot3"].trs.rotation[2] += sign3*0.01;

      max_val = 0.2;
      if (nodeInfosByName["foot4"].trs.rotation[2] >= max_val) {
        sign3 = -1;
      } else if (nodeInfosByName["foot4"].trs.rotation[2] <= - max_val) {
        sign3 = 1;
      }
      nodeInfosByName["foot4"].trs.rotation[2] += sign3*0.01;
    };

    // Compute all the matrices for rendering
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = multiply(viewProjectionMatrix, object.worldMatrix);
    });

    // ------ Draw the objects --------

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // We have to rebind buffers when changing programs because we
        // only bind buffers the program uses. So if 2 programs use the same
        // bufferInfo but the 1st one uses only positions the when the
        // we switch to the 2nd one some of the attributes will not be on.
        bindBuffers = true;
      }

      // Setup all the needed attributes.
      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    requestAnimationFrame(render);
  };
};

main();
