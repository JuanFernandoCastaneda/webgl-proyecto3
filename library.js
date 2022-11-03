/*
Orden en que pasan las cosas con Webgl:
Se crean los shaders, se compilan para verificar que melos.
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsText);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling vertex shader", gl.getShaderInfoLog(vertexShader));
        return;
    }
*/

const vsText = `
precision mediump float;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProjection;

attribute vec4 vertPosition;
attribute vec3 vertNormal;
attribute vec2 vertTexture;
attribute vec2 vertTexture2;

varying vec3 fragNormal;
varying vec2 fragTexture;
varying vec2 fragTexture2;
varying vec3 posicion;

void main() {
    fragTexture = vertTexture;
    fragTexture2 = vertTexture2;
    fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;
    posicion = (vertPosition).xyz;
    gl_Position = mProjection * mView * mWorld * vertPosition;
}
`;

/*
Debo buscar la fórmula esa para que se vea destino sobrepuesto.
*/
const fsText = `
precision mediump float;

varying vec3 fragNormal;
varying vec2 fragTexture;
varying vec2 fragTexture2;
varying vec3 posicion;

uniform sampler2D sampler;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProjection;

uniform vec3 ambientLight;
uniform vec3 sunLight;
uniform vec3 sunDirection;
uniform vec3 torchLight;
uniform vec3 torchDirection;

void main() {
    vec4 texel = texture2D(sampler, fragTexture);
    vec4 texel2 = texture2D(sampler, fragTexture2);

    vec3 light = ambientLight 
        + sunLight * max(dot(fragNormal, normalize(sunDirection - posicion)), 0.0)
        + vec3(0, 0, 0) * torchLight * max(dot(fragNormal, normalize(torchDirection - posicion)), 0.0);

    gl_FragColor = vec4((texel.rgb + texel2.rgb) * light, texel.a + texel2.a);

}
`;

// (vec4(sunDirection, 0.0)*mWorld*mProjection).xyz

const canvas = document.getElementById("canva");
const gl = canvas.getContext("webgl");
const mat4 = glMatrix.mat4;
const glmat = glMatrix.glMatrix;

const curva = [{"x":100,"y":50,"t":0},{"x":94.11999999999999,"y":47.1776,"t":0.02},{"x":88.47999999999999,"y":44.700799999999994,"t":0.04},{"x":83.08,"y":42.5552,"t":0.06},{"x":77.92,"y":40.7264,"t":0.08},{"x":73,"y":39.2,"t":0.1},{"x":68.32,"y":37.9616,"t":0.12},{"x":63.879999999999995,"y":36.9968,"t":0.14},{"x":59.679999999999986,"y":36.291199999999996,"t":0.16},{"x":55.720000000000006,"y":35.830400000000004,"t":0.18},{"x":52.00000000000001,"y":35.60000000000001,"t":0.2},{"x":48.52,"y":35.58560000000001,"t":0.22},{"x":45.28,"y":35.772800000000004,"t":0.24},{"x":42.28,"y":36.1472,"t":0.26},{"x":39.519999999999996,"y":36.6944,"t":0.28},{"x":36.99999999999999,"y":37.4,"t":0.3},{"x":34.71999999999999,"y":38.249599999999994,"t":0.32},{"x":32.679999999999986,"y":39.2288,"t":0.34},{"x":30.880000000000003,"y":40.3232,"t":0.36},{"x":29.320000000000004,"y":41.5184,"t":0.38},{"x":28.000000000000004,"y":42.80000000000001,"t":0.4},{"x":26.920000000000005,"y":44.153600000000004,"t":0.42},{"x":26.080000000000005,"y":45.56480000000001,"t":0.44},{"x":25.480000000000004,"y":47.0192,"t":0.46},{"x":25.119999999999997,"y":48.5024,"t":0.48},{"x":25,"y":50,"t":0.5},{"x":25.119999999999997,"y":51.497600000000006,"t":0.52},{"x":25.479999999999997,"y":52.9808,"t":0.54},{"x":26.080000000000002,"y":54.435199999999995,"t":0.56},{"x":26.92,"y":55.8464,"t":0.58},{"x":28.000000000000004,"y":57.2,"t":0.6},{"x":29.320000000000004,"y":58.48160000000001,"t":0.62},{"x":30.880000000000003,"y":59.6768,"t":0.64},{"x":32.68000000000001,"y":60.77120000000001,"t":0.66},{"x":34.72000000000001,"y":61.75040000000001,"t":0.68},{"x":36.99999999999999,"y":62.599999999999994,"t":0.7},{"x":39.519999999999996,"y":63.3056,"t":0.72},{"x":42.28,"y":63.8528,"t":0.74},{"x":45.28,"y":64.22720000000001,"t":0.76},{"x":48.52,"y":64.4144,"t":0.78},{"x":52.00000000000001,"y":64.4,"t":0.8},{"x":55.719999999999985,"y":64.1696,"t":0.82},{"x":59.679999999999986,"y":63.7088,"t":0.84},{"x":63.879999999999995,"y":63.0032,"t":0.86},{"x":68.32,"y":62.038399999999996,"t":0.88},{"x":73,"y":60.8,"t":0.9},{"x":77.92,"y":59.273599999999995,"t":0.92},{"x":83.08,"y":57.44480000000001,"t":0.94},{"x":88.47999999999999,"y":55.2992,"t":0.96},{"x":94.11999999999999,"y":52.8224,"t":0.98},{"x":100,"y":50,"t":1}]
const sphereQuality = 20;
const sphereTextureSize = (sphereQuality + 1) ** 2 * 2

async function main() {
    
    const program = biolerplateGl(gl);

    let mWorld = mat4.create();
    const mWorldLoc = gl.getUniformLocation(program, "mWorld");
    gl.uniformMatrix4fv(mWorldLoc, false, mWorld);
    // -10,0,-2
    let mView = mat4.lookAt(mat4.create(), [-10, 0, -2], [0, 0, 0], [0, 1, 0]);
    const mViewLoc = gl.getUniformLocation(program, "mView");
    gl.uniformMatrix4fv(mViewLoc, false, mView);

    let mProjection = mat4.perspective(mat4.create(), glmat.toRadian(45),
        canvas.width / canvas.height, 0.1, 1000.0);
    const mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    gl.uniformMatrix4fv(mProjectionLoc, false, mProjection);

    const jackBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    const positionLoc = gl.getAttribLocation(program, "vertPosition");
    const normalLoc = gl.getAttribLocation(program, "vertNormal");
    const textureLoc = gl.getAttribLocation(program, "vertTexture");
    const textureLoc2 = gl.getAttribLocation(program, "vertTexture2");

    initializeBuffers(gl, jackBuffer, indexBuffer, positionLoc, normalLoc, textureLoc, textureLoc2);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('texture'));
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE0);

    const ambientLightLoc = gl.getUniformLocation(program, "ambientLight");
    const sunLightLoc = gl.getUniformLocation(program, "sunLight");
    const sunDirectionLoc = gl.getUniformLocation(program, "sunDirection");
    const torchLightLoc = gl.getUniformLocation(program, "torchLight");
    const torchDirectionLoc = gl.getUniformLocation(program, "torchDirection");

    let ambientLight = [0.3, 0.3, 0.3];
    let sunLight = [0.5, 0.5, 0.5];
    let sunDirection = [10, 0, 0];
    let torchLight = [0.55, 0.55, 0.55];
    let torchDirection = [0, 10, 0];

    let period = 0;
    let yRotationMatrix = new Float32Array(16);
    let xRotationMatrix = new Float32Array(16);
    let identityMatrix = mat4.create();

    const texturasCamisetaHombre = generateCubeTexture(0.733, 0, 0.996, 0.462);

    const cielo = new Cube(generateCubeTexture(0.1, 0.602, 0.439, 0.945), new Array(48).fill(0), false);
    cielo.scale(40, 40, 40);

    const sun = new Sphere(generateSphereTexture(0.462, 0.52, 0.822, 0.801), new Array(sphereTextureSize).fill(1), sphereQuality, true);
    sun.scale(2, 2, 2);
    sun.translate(16, 5, -10);
    sunDirection = [14, 3, -8, 1];
    sunLight = [0.5, 0.5, 0.5];

    const montaniaTextura = generateSphereTexture(0.452, 0.022, 0.664, 0.224);

    const montania1 = new Sphere(montaniaTextura, new Array(sphereTextureSize).fill(0), sphereQuality, true);
    montania1.scale(5, 5, 5);    
    montania1.translate(0, -5.5, 0);

    const torch = new Farol([0.11, 0.149, 0.11, 0.149], [0.462, 0.52, 0.822, 0.801], false);
    torch.scale(1, 0.3, 1);
    torch.translate(0, 2, 0);

    const farol = new Farol([0, 0, 0, 0], [0.188, 0.145, 0.188, 0.145], true);
    farol.scale(1, 2, 1);
    farol.rotate(0, -Math.PI/2);
    farol.translate(-1.5, 0, 0);
    let farolAngle = 0;

    const taiyaki = new Cube(generateCubeTexture(0.523, 0.253, 0.637, 0.457), new Array(48).fill(0), true);
    taiyaki.scale(0.3, 0.3, 0.3)
    taiyaki.translate(-0.3, 0.4, -0.5);

    const cubo = new Persona(new Array(48).fill(1), texturasCamisetaHombre, true);
    cubo.animateLeftArm(Math.PI/2);

    document.addEventListener('keydown', function(event) {
        if(event.key == " ") {
            salto = true;
        }
    });

    let salto = false;
    let caida = false;
    let cuentaSalto = 0;
    const incrementoSalto = 0.1;
    const saltoMax = 2;

    let reverseLeg = false;
    let legAngle = 0;


    const loop = () => {

        // How much time the figure will take to rotate 360 degrees.
        period = performance.now() / 1000 / 10 * 2 * Math.PI;

        // Operating the matrix to rotate in the period, by the y axis.
        // 1, 1, 0
        mat4.rotate(yRotationMatrix, identityMatrix, period, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, period / 1000, [1, 0, 0]);
        mat4.mul(mWorld, yRotationMatrix, xRotationMatrix);

        // Setting up the color with which one's clears.
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        // Clearing both the color and the depth.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        
        legAngle += 0.05;
        if(Math.abs(legAngle) >= Math.PI/4) {
            legAngle = 0;
            reverseLeg = !reverseLeg;
        }
        cubo.animateRightLeg(reverseLeg ? -0.05 : 0.05);
        cubo.animateLeftLeg(reverseLeg ? 0.05 : -0.05);
        cubo.animateRightArm(reverseLeg ? -0.05 : 0.05)

        if(salto == true) {
            cuentaSalto += 1;
            cubo.translate(0, 1-curva[cuentaSalto].x/100, (curva[cuentaSalto].y-50)/100);
            taiyaki.translate(0, 1-curva[cuentaSalto].x/100, (curva[cuentaSalto].y-50)/100);
        }

        taiyaki.paint(gl);
        cubo.paint(gl);

        if(salto == true) {
            cubo.translate(0, -1+curva[cuentaSalto].x/100, -(curva[cuentaSalto].y-50)/100);
            taiyaki.translate(0, -1+curva[cuentaSalto].x/100, -(curva[cuentaSalto].y-50)/100);
            if(cuentaSalto >= curva.length -1) {
                caida = true;
                cuentaSalto = 0;
                salto = false;
            }
        }

        cielo.paint(gl);

        sun.paint(gl);

        montania1.paint(gl);

        
        farolAngle += 0.008;
        // Con el z
        
        farol.rotate(0, 0.008);
        farol.translate(0, Math.sin(farolAngle)*5-5, -Math.cos(farolAngle)*5-0.1);
        farol.paint(gl);
        farol.translate(0, -Math.sin(farolAngle)*5+5, Math.cos(farolAngle)*5+0.1);

        torchDirection = [-1.5, Math.sin(farolAngle)*5-5, -Math.cos(farolAngle)*5-0.1];
        
        gl.uniformMatrix4fv(mWorldLoc, false, mWorld);

        mat4.mul(sunDirection, yRotationMatrix, xRotationMatrix);

        gl.uniform3f(ambientLightLoc, ...ambientLight);
        gl.uniform3f(sunLightLoc, ...sunLight);
        gl.uniform3f(sunDirectionLoc, ...sunDirection);
        gl.uniform3f(torchLightLoc, ...torchLight);
        gl.uniform3f(torchDirectionLoc, ...torchDirection);

        // 1. How we are going to draw.
        // 2. Quantity of elements.
        // 3. Type of elements.
        // 4. Skip.

        // Every time the computer is ready to update it, it will.
        // If tab looses focus the function pauses execution.
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);


}

function biolerplateGl(gl) {
    if (!gl) {
        alert("WebGL está desactivado");
        return;
    }
    gl.enable(gl.DEPTH_TEST);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertexShader, vsText);
    gl.shaderSource(fragmentShader, fsText);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling vertex shader", gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling fragment shader", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking program", gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    // This is only made in debbug. It's expensive.
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error("Error validating program", gl.getProgramInfoLog(program));
        return;
    }

    return program;
}


function initializeBuffers(gl, jackBuffer, indexBuffer, positionLocation, normalLocation,
    textureLocation, textureLocation2) {
    const positionSize = 4;
    const normalSize = 3;
    const textureSize = 2;
    const positionStride = positionSize * Float32Array.BYTES_PER_ELEMENT;
    const normalStride = normalSize * Float32Array.BYTES_PER_ELEMENT;
    const textureStride = textureSize * Float32Array.BYTES_PER_ELEMENT;
    const vertexSize = positionStride + normalStride + textureStride * 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, jackBuffer);
    gl.vertexAttribPointer(positionLocation, positionSize, gl.FLOAT, false, vertexSize, 0);
    gl.vertexAttribPointer(normalLocation, normalSize, gl.FLOAT, false, vertexSize, positionStride);
    gl.vertexAttribPointer(textureLocation, textureSize, gl.FLOAT, false, vertexSize,
        positionStride + normalStride);
    gl.vertexAttribPointer(textureLocation2, textureSize, gl.FLOAT, false, vertexSize,
        positionStride + normalStride + textureStride);

    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(normalLocation);
    gl.enableVertexAttribArray(textureLocation);
    gl.enableVertexAttribArray(textureLocation2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
}

class Figure3D {

    /*
    La idea es poner posiciones, normales y colores en un solo arreglo para pasar al buffer.
    Vertices son 4 coordenadas, igual que colors. Normals son 3.
    */
    constructor(positions, indices, normals, textures, textures2, wayOfDrawing, outwards) {
        if (positions.length % 4 != 0) throw "El arreglo de posiciones no tiene tamaño múltiplod de 4."
        if (normals.length % 3 != 0) throw "El arreglo de normales no tiene tamaño múltiplo de 3."
        if (textures.length % 2 != 0) throw "El arreglo de texturas 1 no tiene tamaño múltiplo de 2."
        if (textures2.length % 2 != 0) throw "El arreglo de texturas 2 no tiene tamaño múltiplo de 2."

        this.jackArray = new Float32Array(positions.length + normals.length + textures.length + textures2.length);

        for (let i = 0; i < positions.length / 4; i++) {
            this.jackArray[i * 11] = positions[i * 4];
            this.jackArray[i * 11 + 1] = positions[i * 4 + 1];
            this.jackArray[i * 11 + 2] = positions[i * 4 + 2];
            this.jackArray[i * 11 + 3] = positions[i * 4 + 3];

            this.jackArray[i * 11 + 4] = outwards ? normals[i * 3] : -normals[i * 3];
            this.jackArray[i * 11 + 5] = outwards ? normals[i * 3 + 1] : -normals[i * 3 + 1];
            this.jackArray[i * 11 + 6] = outwards ? normals[i * 3 + 2] : -normals[i * 3 + 2];

            this.jackArray[i * 11 + 7] = textures[i * 2];
            this.jackArray[i * 11 + 8] = textures[i * 2 + 1];
            this.jackArray[i * 11 + 9] = textures2[i * 2];
            this.jackArray[i * 11 + 10] = textures2[i * 2 + 1];
        }

        this.distanceFromOrigin = [0, 0, 0];

        this.indices = new Uint16Array(indices);

        this.wayOfDrawing = wayOfDrawing;
    }

    /*
    Como nunca cambiamos de buffer, realmente no es necesario incluirlos como parámetro.
    */
    paint(gl) {
        gl.bufferData(gl.ARRAY_BUFFER, this.jackArray, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        gl.drawElements(this.wayOfDrawing, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    translate(x, y, z) {
        for (let i = 0; i < this.jackArray.length / 11; i++) {
            this.distanceFromOrigin = [
                this.distanceFromOrigin[0] + x,
                this.distanceFromOrigin[1] + y,
                this.distanceFromOrigin[2] + z,
            ]
            this.jackArray[i * 11] += x;
            this.jackArray[i * 11 + 1] += y;
            this.jackArray[i * 11 + 2] += z;
        }
    }

    scale = (x, y, z) => {
        for (let i = 0; i < this.jackArray.length / 11; i++) {
            this.jackArray[i * 11] *= x;
            this.jackArray[i * 11 + 1] *= y;
            this.jackArray[i * 11 + 2] *= z;
        }
    }

    rotate = (axis, theta) => {
        let original;
        const otherAxis1 = (1 + axis) % 3;
        const otherAxis2 = (2 + axis) % 3;
        for (let i = 0; i < this.jackArray.length / 11; i++) {
            original = this.jackArray[i * 11 + otherAxis1];
            this.jackArray[i * 11 + otherAxis1] = Math.cos(theta) * original
                - Math.sin(theta) * this.jackArray[i * 11 + otherAxis2];
            this.jackArray[i * 11 + otherAxis2] = Math.sin(theta) * original
                + Math.cos(theta) * this.jackArray[i * 11 + otherAxis2];
        }
    }

    goOrigin() {
        this.translate(-this.distanceFromOrigin[0], -this.distanceFromOrigin[1], -this.distanceFromOrigin[2]);
        this.distanceFromOrigin = [0, 0, 0];
    }
}

// Tiene 24 vértices.
class Cube extends Figure3D {
    constructor(textures, textures2, outwards) {
        if (textures.length / 2 != 24) throw "El arreglo de texturas 1 del cubo no corresponde con la cantidad de vértices."
        if (textures2.length / 2 != 24) throw "El arreglo de texturas 2 del cubo no corresponde con la cantidad de vértices."

        const vertices = [
            // Cara de atrás
            -0.5, -0.5, -0.5, 1,
            0.5, -0.5, -0.5, 1,
            0.5, 0.5, -0.5, 1,
            -0.5, 0.5, -0.5, 1,

            // Cara de en frente
            -0.5, -0.5, 0.5, 1,
            0.5, -0.5, 0.5, 1,
            0.5, 0.5, 0.5, 1,
            -0.5, 0.5, 0.5, 1,

            // Cara de abajo
            -0.5, -0.5, -0.5, 1,
            0.5, -0.5, -0.5, 1,
            0.5, -0.5, 0.5, 1,
            -0.5, -0.5, 0.5, 1,

            // Cara de arriba
            -0.5, 0.5, -0.5, 1,
            0.5, 0.5, -0.5, 1,
            0.5, 0.5, 0.5, 1,
            -0.5, 0.5, 0.5, 1,

            // Cara de la derecha
            0.5, -0.5, -0.5, 1,
            0.5, -0.5, 0.5, 1,
            0.5, 0.5, 0.5, 1,
            0.5, 0.5, -0.5, 1,

            // Cara de la izquierda
            -0.5, -0.5, -0.5, 1,
            -0.5, -0.5, 0.5, 1,
            -0.5, 0.5, 0.5, 1,
            -0.5, 0.5, -0.5, 1,
        ]

        const indices = [...Array(6).keys()].reduce((previous, current) => {
            previous.push(current * 4, current * 4 + 2, current * 4 + 1,
                current * 4, current * 4 + 2, current * 4 + 3);
            return previous;
        }, [])

        const normals = [
            // Cara de atrás
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,

            // Cara de en frente
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,

            // Cara de abajo
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,

            // Cara de arriba
            -0.5, 0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,

            // Cara de la derecha
            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,

            // Cara de la izquierda
            -0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, -0.5,
        ]
        super(vertices, indices, normals, textures, textures2, gl.TRIANGLES, outwards);
    }
}

function generateCubeTexture(minX, minY, maxX, maxY) {
    const texturasCubo1 = new Array(48);
    for (let i = 0; i < texturasCubo1.length / 8; i++) {
        texturasCubo1[i * 8] = minX;
        texturasCubo1[i * 8 + 1] = maxY;

        texturasCubo1[i * 8 + 2] = maxX;
        texturasCubo1[i * 8 + 3] = maxY;

        texturasCubo1[i * 8 + 4] = maxX;
        texturasCubo1[i * 8 + 5] = minY;

        texturasCubo1[i * 8 + 6] = minX;
        texturasCubo1[i * 8 + 7] = minY;
    }
    return texturasCubo1;
}

function generateSphereTexture(minX, minY, maxX, maxY) {
    const montaniaTextura = new Array(sphereTextureSize);
    for(let i = 0; i < sphereTextureSize; i++) {
        if(i % 4 == 0) {
            montaniaTextura[i] = minX;
        } else if(i % 4 == 1) {
            montaniaTextura[i] = minY;
        } else if(i % 4 == 2){
            montaniaTextura[i] = maxX;
        } else {
            montaniaTextura[i] = maxY;
        }
    }
    return montaniaTextura;
}

class Sphere extends Figure3D {
    constructor(texture, texture2, SPHERE_DIV, outwards) {
        if(texture.length != (SPHERE_DIV+1) ** 2*2) throw "La primera textura de la esfera no cumple con lo esperado."
        if(texture2.length != (SPHERE_DIV+1) ** 2*2) throw "La segunda textura de la esfera no cumple con lo esperado."
        const vertices = [], indices = [], normales = [];
        for (let j = 0; j <= SPHERE_DIV; j++) {
            let aj = j * Math.PI / SPHERE_DIV;
            let sj = Math.sin(aj);
            let cj = Math.cos(aj);
            for (let i = 0; i <= SPHERE_DIV; i++) {
                let ai = i * 2 * Math.PI / SPHERE_DIV;
                let si = Math.sin(ai);
                let ci = Math.cos(ai);

                vertices.push(si * sj);  // X
                vertices.push(cj);       // Y
                vertices.push(ci * sj);  // Z
                vertices.push(1);
            }
        }

        for (let j = 0; j <= SPHERE_DIV; j++) {
            let aj = j * Math.PI / SPHERE_DIV;
            let sj = Math.sin(aj);
            let cj = Math.cos(aj);
            for (let i = 0; i <= SPHERE_DIV; i++) {
                let ai = i * 2 * Math.PI / SPHERE_DIV;
                let si = Math.sin(ai);
                let ci = Math.cos(ai);

                normales.push(si * sj);  // X
                normales.push(cj);       // Y
                normales.push(ci * sj);  // Z
            }
        }

        // Indices
        for (let j = 0; j < SPHERE_DIV; j++) {
            for (let i = 0; i < SPHERE_DIV; i++) {
                let p1 = j * (SPHERE_DIV + 1) + i;
                let p2 = p1 + (SPHERE_DIV + 1);

                indices.push(p1);
                indices.push(p2);
                indices.push(p1 + 1);

                indices.push(p1 + 1);
                indices.push(p2);
                indices.push(p2 + 1);
            }
        }
        super(vertices, indices, normales, texture, texture2, gl.TRIANGLES, outwards);
    }
}

class ComplexFigure3D {
    constructor(figures) {
        this.figures = figures;
    }

    paint(gl) {
        this.figures.forEach((figure) => figure.paint(gl))
    }

    translate(x, y, z) {
        this.figures.forEach((figure) => figure.translate(x, y, z))
    }

    scale(x, y, z) {
        this.figures.forEach((figure) => figure.scale(x, y, z))
    }

    rotate(axis, theta) {
        this.figures.forEach((figure) => figure.rotate(axis, theta));
    }

    goOrigin() {
        this.figures.forEach((figure) => figure.goOrigin());
    }
}

class Persona extends ComplexFigure3D {
    constructor(shirtTexture1, shirtTexture2, hasLongHair) {
        const emptyCubeTexture = new Array(48).fill(1)
        const cabeza = new Cube(generateCubeTexture(0.224, 0.221, 0.224, 0.221), new Array(48).fill(1), true);
        cabeza.scale(0.35, 0.2, 0.35);
        cabeza.translate(0, 0.4, 0);
        const shirt = new Cube(shirtTexture1, shirtTexture2, true);
        shirt.scale(0.5, 0.4, 0.4);
        shirt.translate(0, 0.1, 0);
        const legTexture = generateCubeTexture(0.280, 0.372, 0.280, 0.372);
        const firstArm = new Cube(shirtTexture1, emptyCubeTexture, true);
        firstArm.scale(0.15, 0.45, 0.25);
        firstArm.translate(0.325, 0.075, 0);
        const secondArm = new Cube(shirtTexture1, emptyCubeTexture, true);
        secondArm.scale(0.15, 0.45, 0.25);
        secondArm.translate(-0.325, 0.075, 0);
        const firstLeg = new Cube(legTexture, emptyCubeTexture, true);
        firstLeg.scale(0.25, 0.4, 0.25);
        firstLeg.translate(-0.125, -0.3, 0);
        const secondLeg = new Cube(legTexture, emptyCubeTexture, true);
        secondLeg.scale(0.25, 0.4, 0.25);
        secondLeg.translate(0.125, -0.3, 0);

        super([cabeza, shirt, firstArm, secondArm, firstLeg, secondLeg]);
        this.ySize = 1
    }

    scale(x, y, z) {
        this.ySize *= y;
        super.scale(x, y, z);
    }

    animateRightArm(angle) {
        this.figures[2].translate(0, -0.3*this.ySize, 0);
        this.figures[2].rotate(0, angle);
        this.figures[2].translate(0, 0.3*this.ySize, 0);
    }

    animateLeftArm(angle) {
        this.figures[3].translate(0, -0.3*this.ySize, 0);
        this.figures[3].rotate(0, angle);
        this.figures[3].translate(0, 0.3*this.ySize, 0);
    }

    animateRightLeg(angle) {
        const moduledAngle = angle % Math.PI;
        this.figures[4].translate(0, -0.3*this.ySize, 0);
        this.figures[4].rotate(0, moduledAngle);
        this.figures[4].translate(0, 0.3*this.ySize, 0);
    }

    animateLeftLeg(angle) {
        const moduledAngle = angle % Math.PI;
        this.figures[5].translate(0, -0.3*this.ySize, 0);
        this.figures[5].rotate(0, moduledAngle);
        this.figures[5].translate(0, 0.3*this.ySize, 0);
    }
}

class Farol extends ComplexFigure3D {
    constructor(baseTexture, flameTexture, grande) {
        if(baseTexture.length != 4) throw "La textura de la base del farol ta mal"
        if(flameTexture.length != 4) throw "La textura de la flama del farol ta mal"

        const base = new Cube(generateCubeTexture(...baseTexture), new Array(48).fill(0), true);
        const flame1 = new Cube(generateCubeTexture(...flameTexture), new Array(48).fill(0), true);
        const flame2 = new Cube(generateCubeTexture(...flameTexture), new Array(48).fill(0), true);
        const flame3 = new Cube(generateCubeTexture(...flameTexture), new Array(48).fill(0), true);
        const flame4 = new Cube(generateCubeTexture(...flameTexture), new Array(48).fill(0), true);

        if(grande) {
            base.scale(0.25, 0.8, 0.25);
            base.translate(0, -0.1, 0);
            flame1.scale(0.4, 0.2, 0.4);
            flame1.translate(0, 0.4, 0);
            flame2.scale(0, 0, 0);
            flame3.scale(0, 0, 0);
            flame4.scale(0, 0, 0);
        } else {
            base.scale(0.175, 0.4, 0.175);
            base.translate(0, -0.3, 0);
            flame1.scale(0.4, 0.2, 0.4); // esta es la segunda desde abajo.
            flame1.translate(0, 0.1, 0);
            flame2.scale(0.3, 0.2, 0.3); // esta es la segunda desde arriba.
            flame2.translate(0, 0.3, 0);
            flame3.scale(0.2, 0.1, 0.2); // esta es la de arriba.
            flame3.translate(0, 0.45, 0);
            flame4.scale(0.35, 0.1, 0.35); // esta es la de abajo.
            flame4.translate(0, -0.05, 0);
        }
        
        super([base, flame1, flame2, flame3, flame4]);
    }
}

main()