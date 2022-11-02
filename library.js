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

void main() {
    fragTexture = vertTexture;
    fragTexture2 = vertTexture2;
    fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;
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

uniform sampler2D sampler;

uniform vec3 ambientLight;
uniform vec3 sunLight;
uniform vec3 sunDirection;
uniform vec3 torchLight;
uniform vec3 torchDirection;

void main() {
    vec4 texel = texture2D(sampler, fragTexture);
    vec4 texel2 = texture2D(sampler, fragTexture2);

    vec3 light = ambientLight 
        + sunLight * max(dot(fragNormal, normalize(sunDirection)), 0.0)
        + torchLight * max(dot(fragNormal, normalize(sunDirection)), 0.0);

    gl_FragColor = vec4((texel.rgb + texel2.rgb) * light, texel.a + texel2.a);

}
`;

const canvas = document.getElementById("canva");
const gl = canvas.getContext("webgl");
const mat4 = glMatrix.mat4;
const glmat = glMatrix.glMatrix;

const sphereQuality = 20;
const sphereTextureSize = (sphereQuality + 1) ** 2 * 2

function main() {

    const program = biolerplateGl(gl);

    let mWorld = mat4.create();
    const mWorldLoc = gl.getUniformLocation(program, "mWorld");
    gl.uniformMatrix4fv(mWorldLoc, false, mWorld);

    let mView = mat4.lookAt(mat4.create(), [0, 0, 10], [0, 0, 0], [0, 1, 0]);
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
    let torchLight = [0.2, 0.2, 0.2];
    let torchDirection = [0, 10, 0];

    let period = 0;
    let yRotationMatrix = new Float32Array(16);
    let xRotationMatrix = new Float32Array(16);
    let identityMatrix = mat4.create();

    const texturasCubo1 = new Array(48);
    for (let i = 0; i < texturasCubo1.length / 8; i++) {
        texturasCubo1[i * 8] = 0;
        texturasCubo1[i * 8 + 1] = 1;

        texturasCubo1[i * 8 + 2] = 1;
        texturasCubo1[i * 8 + 3] = 1;

        texturasCubo1[i * 8 + 4] = 1;
        texturasCubo1[i * 8 + 5] = 0;

        texturasCubo1[i * 8 + 6] = 0;
        texturasCubo1[i * 8 + 7] = 0;
    }
    const cubo = new Persona(texturasCubo1, new Array(48).fill(0), true);

    //const esfera = new Sphere(new Array(sphereTextureSize).fill(0.25), new Array(sphereTextureSize).fill(0), sphereQuality);

    const loop = () => {

        // How much time the figure will take to rotate 360 degrees.
        period = performance.now() / 1000 / 10 * 2 * Math.PI;

        // Operating the matrix to rotate in the period, by the y axis.
        // 1, 1, 0
        mat4.rotate(yRotationMatrix, identityMatrix, period, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, period / 10, [1, 0, 0]);
        mat4.mul(mWorld, yRotationMatrix, xRotationMatrix);
        gl.uniformMatrix4fv(mWorldLoc, false, mWorld);

        gl.uniform3f(ambientLightLoc, ...ambientLight);
        gl.uniform3f(sunLightLoc, ...sunLight);
        gl.uniform3f(sunDirectionLoc, ...sunDirection);
        gl.uniform3f(torchLightLoc, ...torchLight);
        gl.uniform3f(torchDirectionLoc, ...torchDirection);

        // Setting up the color with which one's clears.
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        // Clearing both the color and the depth.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        cubo.paint(gl);

        //esfera.paint(gl);

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
    constructor(positions, indices, normals, textures, textures2, wayOfDrawing) {
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

            this.jackArray[i * 11 + 4] = normals[i * 3];
            this.jackArray[i * 11 + 5] = normals[i * 3 + 1];
            this.jackArray[i * 11 + 6] = normals[i * 3 + 2];

            this.jackArray[i * 11 + 7] = textures[i * 2];
            this.jackArray[i * 11 + 8] = textures[i * 2 + 1];
            this.jackArray[i * 11 + 9] = textures2[i * 2];
            this.jackArray[i * 11 + 10] = textures2[i * 2 + 1];
        }

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
            original = this.vertices[i * 12 + otherAxis1];
            this.vertices[i * 11 + otherAxis1] = Math.cos(theta) * original
                - Math.sin(theta) * this.vertices[i * 11 + otherAxis2];
            this.vertices[i * 11 + otherAxis2] = Math.sin(theta) * original
                + Math.cos(theta) * this.vertices[i * 11 + otherAxis2];
        }
    }
}

// Tiene 24 vértices.
class Cube extends Figure3D {
    constructor(textures, textures2) {
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
        super(vertices, indices, normals, textures, textures2, gl.TRIANGLES);
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

class Sphere extends Figure3D {
    constructor(texture, texture2, SPHERE_DIV) {
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

        console.log(vertices, indices);
        super(vertices, indices, normales, texture, texture2, gl.TRIANGLES);
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
}

class Persona extends ComplexFigure3D {
    constructor(shirtTexture1, shirtTexture2, hasLongHair) {
        const shirt = new Cube(shirtTexture1, shirtTexture2);
        const legTexture = generateCubeTexture(0.280, 0.372, 0.280, 0.372);
        const firstLeg = new Cube(legTexture, new Array(48).fill(1));
        firstLeg.translate(2, 0, 0);
        super([shirt, firstLeg]);
    }
}

main()