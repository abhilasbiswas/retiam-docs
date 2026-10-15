import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
// examples/demos/texture_mapping.ts

import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { Model } from "retiam";
import { Math3D } from "retiam";
import { light } from "retiam";
import { OrbitCameraController } from "retiam";
import { Vec3 } from "retiam";

// Procedural Normal Map generator for clean, self-contained loading
function createBumpyNormalMap(size: number = 1024, bumps: number = 24, bumpHeight: number = 4.0): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / size;
            const v = y / size;
            const freq = bumps * Math.PI * 2;

            const dHdu = freq * Math.cos(u * freq) * Math.sin(v * freq);
            const dHdv = freq * Math.sin(u * freq) * Math.cos(v * freq);

            let nx = -dHdu;
            let ny = -dHdv;
            let nz = 1.0 / bumpHeight;

            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx /= len; ny /= len; nz /= len;

            const index = (y * size + x) * 4;
            data[index + 0] = Math.floor((nx * 0.5 + 0.5) * 255);
            data[index + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
            data[index + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
            data[index + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
}


// Procedural "Minor Noisy Uneven Random" Normal Map generator
// Generates a tileable surface combining smooth uneven fractal noise and minor fine grain.
function createUnevenNoisyNormalMap(
    size: number = 1024,
    noiseScale: number = 12,     // Scale of the uneven patches (must be integer for seamless tiling)
    bumpIntensity: number = 3.0, // Overall intensity of the uneven structural bumps
    grainIntensity: number = 0.1 // Strength of the minor high-frequency random noise
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Pseudo-random number generator (PRNG) returning values between 0.0 and 1.0
    const hash = (x: number, y: number) => {
        const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return h - Math.floor(h);
    };

    // Smooth 2D value noise with seamless edge wrapping
    const smoothNoise = (x: number, y: number, freq: number) => {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;

        // Smoothstep interpolation for rounded bumps
        const ux = fx * fx * (3.0 - 2.0 * fx);
        const uy = fy * fy * (3.0 - 2.0 * fy);

        // Wrap grid coordinates to tile seamlessly
        const ixf0 = ix % freq;
        const iyf0 = iy % freq;
        const ixf1 = (ix + 1) % freq;
        const iyf1 = (iy + 1) % freq;

        const a = hash(ixf0, iyf0);
        const b = hash(ixf1, iyf0);
        const c = hash(ixf0, iyf1);
        const d = hash(ixf1, iyf1);

        return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };

    // Fractal Brownian Motion (fBm) to combine multiple layers of noise
    const fbm = (u: number, v: number) => {
        let val = 0.0;
        let amp = 0.5;
        let freq = Math.floor(noiseScale);
        for (let i = 0; i < 4; i++) { // 4 octaves of noise
            val += amp * smoothNoise(u * freq, v * freq, freq);
            freq *= 2.0;
            amp *= 0.5;
        }
        return val;
    };

    // Step 1: Precompute a heightmap for performance
    // Doing this in a separate pass stops the math from being calculated 4x per pixel
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / size;
            const v = y / size;

            // Base uneven structural shape
            const structuralBump = fbm(u, v);

            // Minor high-frequency noise (grain/sand-like micro detail)
            const grain = hash(x, y) * grainIntensity;

            heights[y * size + x] = structuralBump + grain;
        }
    }

    // Step 2: Compute normals via central differencing of the heightmap
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Safe modulo wrapping to ensure the normals wrap seamlessly at the image borders
            const xL = (x - 1 + size) % size;
            const xR = (x + 1) % size;
            const yU = (y - 1 + size) % size;
            const yD = (y + 1) % size;

            const hL = heights[y * size + xL];
            const hR = heights[y * size + xR];
            const hU = heights[yU * size + x];
            const hD = heights[yD * size + x];

            // Compute derivatives (gradient mapping)
            const dHdu = (hR - hL) * 0.5;
            const dHdv = (hD - hU) * 0.5;

            // Build the normal vector
            let nx = -dHdu * bumpIntensity;
            let ny = -dHdv * bumpIntensity;
            let nz = 1.0;

            // Normalize the vector (length = 1.0)
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx /= len; ny /= len; nz /= len;

            // Map normals from [-1, 1] range to RGB [0, 255] range
            const index = (y * size + x) * 4;
            data[index + 0] = Math.floor((nx * 0.5 + 0.5) * 255); // Red
            data[index + 1] = Math.floor((ny * 0.5 + 0.5) * 255); // Green
            data[index + 2] = Math.floor((nz * 0.5 + 0.5) * 255); // Blue
            data[index + 3] = 255;                                // Alpha
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

export default class TextureMappingScene extends Scene {
    public async run() {
        // this.ALWAYS_UPDATE = false;
        // RenderConfig.raytraceEnabled = false; // standard raster rendering

        // Reposition light to cast rich specular highlights
        light.position.set([-40, 40, 50]);
        light.color = new Color(50, 50, 50);

        this.camera.position.set([0, 0, 50]);
        new OrbitCameraController(this, this.camera, { radius: 50 });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Texture mapping", "A spherical surface with a continuous UV map");
        // this.clearColor(new Color(0.1, 0.1, 0.12, 1.0));

        const sphereMesh = Math3D.createSphere(15, 64, 64);
        const sphere = new Model(sphereMesh);

        // Load an Unsplash texture and assign our generated bump map
        sphere.setTextureMap("/res/media/earth.jpg");
        // sphere.setNormalMap(createUnevenNoisyNormalMap(1024, 200, 1.5, 0.1));

        sphere.setNormalMap("/res/media/earth_normal_map.tif");
        sphere.material.normalScale = 10;
        sphere.material.color = Color.WHITE;
        sphere.material.roughness = 0.35; // Lower values emphasize normal maps
        this.add(sphere);

        // this.always(() => {
        //     sphere.transform.rotateWorldY(this.dt * 0.0004);
        //     this.invalidate();
        // });
    }
}
