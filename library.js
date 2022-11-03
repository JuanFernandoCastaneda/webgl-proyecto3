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

const curva = [{"x":100,"y":25,"t":0},{"x":94.826,"y":28.835119999999996,"t":0.02},{"x":90.09599999999999,"y":32.544959999999996,"t":0.04},{"x":85.79799999999999,"y":36.136239999999994,"t":0.06},{"x":81.92000000000002,"y":39.615680000000005,"t":0.08},{"x":78.45000000000002,"y":42.99000000000001,"t":0.1},{"x":75.376,"y":46.265919999999994,"t":0.12},{"x":72.68599999999999,"y":49.450160000000004,"t":0.14},{"x":70.368,"y":52.54944,"t":0.16},{"x":68.41,"y":55.570479999999996,"t":0.18},{"x":66.80000000000003,"y":58.52000000000002,"t":0.2},{"x":65.526,"y":61.40472000000001,"t":0.22},{"x":64.57600000000001,"y":64.23136,"t":0.24},{"x":63.937999999999995,"y":67.00664,"t":0.26},{"x":63.599999999999994,"y":69.73728,"t":0.28},{"x":63.54999999999998,"y":72.42999999999999,"t":0.3},{"x":63.775999999999996,"y":75.09151999999999,"t":0.32},{"x":64.26599999999999,"y":77.72855999999999,"t":0.34},{"x":65.00800000000001,"y":80.34784,"t":0.36},{"x":65.99000000000001,"y":82.95608,"t":0.38},{"x":67.20000000000002,"y":85.56,"t":0.4},{"x":68.626,"y":88.16632,"t":0.42},{"x":70.256,"y":90.78176,"t":0.44},{"x":72.078,"y":93.41304000000001,"t":0.46},{"x":74.08,"y":96.06688,"t":0.48},{"x":76.25,"y":98.75,"t":0.5},{"x":78.576,"y":101.46912,"t":0.52},{"x":81.04599999999999,"y":104.23096,"t":0.54},{"x":83.64800000000001,"y":107.04223999999999,"t":0.56},{"x":86.37,"y":109.90968000000001,"t":0.58},{"x":89.19999999999999,"y":112.84,"t":0.6},{"x":92.126,"y":115.83992,"t":0.62},{"x":95.136,"y":118.91616,"t":0.64},{"x":98.218,"y":122.07544000000001,"t":0.66},{"x":101.36000000000001,"y":125.32448000000002,"t":0.68},{"x":104.54999999999998,"y":128.66999999999996,"t":0.7},{"x":107.776,"y":132.11872,"t":0.72},{"x":111.02599999999998,"y":135.67736,"t":0.74},{"x":114.28800000000001,"y":139.35264,"t":0.76},{"x":117.55,"y":143.15128,"t":0.78},{"x":120.80000000000001,"y":147.08,"t":0.8},{"x":124.02599999999998,"y":151.14551999999998,"t":0.82},{"x":127.21599999999998,"y":155.35456,"t":0.84},{"x":130.358,"y":159.71384,"t":0.86},{"x":133.44,"y":164.23008,"t":0.88},{"x":136.45000000000002,"y":168.91000000000003,"t":0.9},{"x":139.376,"y":173.76032,"t":0.92},{"x":142.206,"y":178.78776,"t":0.94},{"x":144.928,"y":183.99904,"t":0.96},{"x":147.53,"y":189.40087999999997,"t":0.98},{"x":150,"y":195,"t":1}];
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

    const cubo = new Persona(new Array(48).fill(1), texturasCamisetaHombre, true);
    cubo.animateLeftArm(Math.PI/2);

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


    let reverseLeg = false;
    let legAngle = 0;

    let contador = 0;
    let descendiente = false;
    let farolAngle = 0;

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

        cubo.paint(gl);

        cielo.paint(gl);

        /*
        sun.translate(0, 
            descendiente ? -(curva[contador].y)/50 : (curva[contador].y)/50, 
            descendiente ? -(curva[contador].x)/5: (curva[contador].x)/5);
        */
        sun.paint(gl);
        /*
        sun.translate(0, 
            descendiente ? (curva[contador].y)/50 : -(curva[contador].y)/50, 
            descendiente ? (curva[contador].x)/5: -(curva[contador].x)/5);
        */

        montania1.paint(gl);

        
        farolAngle += 0.008;
        // Con el z
        
        farol.rotate(0, 0.008);
        farol.translate(0, Math.sin(farolAngle)*5-5, -Math.cos(farolAngle)*5-0.1);
        farol.paint(gl);
        farol.translate(0, -Math.sin(farolAngle)*5+5, Math.cos(farolAngle)*5+0.1);

        torchDirection = [-1.5, Math.sin(farolAngle)*5-5, -Math.cos(farolAngle)*5-0.1];

        //farol.rotate(0, 0.01);
        //farol.translate(0, 3, 0);
        //farol.translate(0, -3, 0);

        //torch.paint(gl);
        //farol.translate()

        console.log(contador);

        contador = descendiente ? contador - 1 : contador + 1;
        if(contador >= curva.length-1 || contador <= 0) {
            descendiente = !descendiente;
        }
        
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