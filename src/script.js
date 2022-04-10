import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { gsap } from 'gsap/all'
import { Power3 } from 'gsap'
/**
 * Base
 */
// Debug
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

// Portal light material
const portalLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

/**
 * Model
 */

gltfLoader.load(
    'withVertexColor.glb',
    (gltf) =>
    {
        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')
        const portalLightMesh = gltf.scene.children.find(child => child.name === 'portalLight')
        const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
        const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')

        portalLightMesh.material = portalLightMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial

        const points = withMeshSampler(bakedMesh)
        scene.add(points)
        sortPoints(points)

        scene.add(portalLightMesh)
        scene.add(poleLightAMesh)
        scene.add(poleLightBMesh)
        gsap.to(points.material.uniforms.uTime, {
            value: 1,
            duration: 2,
            ease: Power3.easeOut
        });
        gsap.to('body', {
            backgroundColor: '#080a08',
            duration: 2,
            ease: Power3.easeOut
        })
    }
)

/**
 * Points
 */

// https://tympanus.net/codrops/2021/08/31/surface-sampling-in-three-js/
function withMeshSampler (mesh) {
    const sampler = new MeshSurfaceSampler(mesh).build();

    const vertices = []
    const colors = []
    const sizes = []
    const tempPosition = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const tempColor = new THREE.Color();
    for (let i = 0; i < 7000; i++) {
        sampler.sample(tempPosition, tempNormal, tempColor);
        vertices.push(tempPosition.x - 1, tempPosition.y, parseFloat(tempPosition.z.toFixed(2) - 1.652))
        tempColor.convertLinearToSRGB()
        colors.push(tempColor.r/255, tempColor.g/255, tempColor.b/255)
        sizes.push(Math.random() * 20 + 2);
    }

    const pointsGeometry = new THREE.BufferGeometry()
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    pointsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    
    const pointsShaderMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute float size;

            varying vec3 vColor;
            varying vec3 vPosition;

            uniform float uTime;

            void main() {
                vColor = color;
                vPosition = (modelMatrix * vec4( position, 1.0 )).xyz;
                gl_PointSize = size * uTime;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
        
            void main() {
                vec2 xy = gl_PointCoord.xy - vec2(0.5);
                float ll = length(xy);
                gl_FragColor = vec4(vColor, step(ll, 0.5));
            }
        `,
        uniforms: {
            uTime: {
                value: 0
            }
        },
        vertexColors: true,
        transparent: true,
        depthWrite: false
    })

    const points = new THREE.Points(pointsGeometry, pointsShaderMaterial);
    return points;
}

// Taken from here: https://threejs.org/examples/?q=points#webgl_custom_attributes_points2
function sortPoints(points) {
    const vector = new THREE.Vector3();

    const matrix = new THREE.Matrix4();
    matrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    matrix.multiply( points.matrixWorld );

    const geometry = points.geometry;

    let index = geometry.getIndex();
    const positions = geometry.getAttribute( 'position' ).array;
    const length = positions.length / 3;

    if ( index === null ) {

        const array = new Uint16Array( length );

        for ( let i = 0; i < length; i ++ ) {

            array[ i ] = i;

        }

        index = new THREE.BufferAttribute( array, 1 );

        geometry.setIndex( index );

    }

    const sortArray = [];

    for ( let i = 0; i < length; i ++ ) {

        vector.fromArray( positions, i * 3 );
        vector.applyMatrix4( matrix );

        sortArray.push( [ vector.z, i ] );

    }

    function numericalSort( a, b ) {

        return b[ 0 ] - a[ 0 ];

    }

    sortArray.sort( numericalSort );

    const indices = index.array;

    for ( let i = 0; i < length; i ++ ) {

        indices[ i ] = sortArray[ i ][ 1 ];

    }

    geometry.index.needsUpdate = true;
}
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = -4
camera.position.y = 2
camera.position.z = -4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
