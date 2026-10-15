import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, Color, CameraController, RenderTarget, ComputeKernel, Res, Sprite, Model, Math3D, WebGPUMesh } from "retiam";

// ------------------------------------------------------------------
// 100% MATCHING DYNAMIC PERLIN NOISE & MARCHING SQUARES MESH GENERATOR
// ------------------------------------------------------------------
function hash22(x: number, y: number): [number, number] {
    let px = (x * 0.1031) % 1.0;
    let py = (y * 0.1030) % 1.0;
    let pz = (x * 0.0973) % 1.0;
    let dotVal = px * py + py * pz + pz * px + 33.33;
    px = (px + dotVal) % 1.0;
    py = (py + dotVal) % 1.0;
    pz = (pz + dotVal) % 1.0;
    let rx = ((px * pz + py * px) % 1.0) * 2.0 - 1.0;
    let ry = ((py * pz + px * py) % 1.0) * 2.0 - 1.0;
    return [rx, ry];
}

function perlin2D(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const wx = xf * xf * (3.0 - 2.0 * xf);
    const wy = yf * yf * (3.0 - 2.0 * yf);

    const [g00x, g00y] = hash22(xi, yi);
    const [g10x, g10y] = hash22(xi + 1, yi);
    const [g01x, g01y] = hash22(xi, yi + 1);
    const [g11x, g11y] = hash22(xi + 1, yi + 1);

    const d00 = g00x * xf + g00y * yf;
    const d10 = g10x * (xf - 1) + g10y * yf;
    const d01 = g01x * xf + g01y * (yf - 1);
    const d11 = g11x * (xf - 1) + g11y * (yf - 1);

    const nx0 = d00 + wx * (d10 - d00);
    const nx1 = d01 + wx * (d11 - d01);
    return (nx0 + wy * (nx1 - nx0)) * 0.5 + 0.5;
}

/**
 * Builds a 3D extruded terrain mesh whose height displacement animates dynamically matching the GPU Perlin noise.
 * Reduced subtle height step (0.25).
 */
function createDynamicExtrudedMesh(width: number, height: number, gridRes: number = 48, time: number = 0): WebGPUMesh {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfW = width / 2;
    const halfH = height / 2;

    function evaluateHeight(u: number, v: number): number {
        const stX = u * 4.0;
        const stY = v * 4.0;
        const n1 = perlin2D(stX + time * 0.1, stY + time * 0.05);
        const n2 = perlin2D(stX * 2.0 - time * 0.15, stY * 2.0 - time * 0.08) * 0.5;
        const val = (n1 + n2) / 1.5;
        // Reduced subtle height step (0.25)
        return val >= 0.5 ? 0.25 : 0.0;
    }

    // 1. Vertices (XY plane, Z is extruded height)
    for (let j = 0; j <= gridRes; j++) {
        const v = j / gridRes;
        const y = halfH - v * height;

        for (let i = 0; i <= gridRes; i++) {
            const u = i / gridRes;
            const x = -halfW + u * width;
            const z = evaluateHeight(u, v);

            positions.push(x, y, z);
            uvs.push(u, v);
        }
    }

    // 2. Triangles
    for (let j = 0; j < gridRes; j++) {
        for (let i = 0; i < gridRes; i++) {
            const row1 = j * (gridRes + 1);
            const row2 = (j + 1) * (gridRes + 1);

            const a = row1 + i;
            const b = row1 + i + 1;
            const c = row2 + i;
            const d = row2 + i + 1;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    return Math3D.computeSmoothShading(positions, indices, uvs);
}

export default class GPUPerlinMarchingSquaresShowcase extends Scene {
    public async run() {
        this.composer!.ALWAYS_UPDATE = true;

        // Frame all 3 stages cleanly in camera top-down view
        this.camera.position.set([0, 0, 14]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Noise → surface → contour", "GPU Perlin noise and marching squares");

        const GRID_RES = 512;

        // 1. RENDER TARGET FOR GPU PERLIN NOISE
        const noiseTarget = new RenderTarget(this, "PerlinNoiseTarget", {
            width: GRID_RES,
            height: GRID_RES,
            type: "storage",
            format: "rgba16float"
        });

        // 2. RENDER TARGET FOR GPU MARCHING SQUARES CONTOURS
        const marchingTarget = new RenderTarget(this, "MarchingSquaresTarget", {
            width: GRID_RES,
            height: GRID_RES,
            type: "storage",
            format: "rgba16float"
        });

        // 3. UNIFORM BUFFER (time, scale, isoThreshold, 0)
        const paramsBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // ------------------------------------------------------------------
        // KERNEL 1: 2D DYNAMIC PERLIN NOISE COMPUTATION
        // ------------------------------------------------------------------
        const noiseKernel = new ComputeKernel(
            {
                "u_params": Res.uniform("vec4<f32>", paramsBuffer),
                "u_outputTex": Res.storageTexture(noiseTarget.storageView!, "rgba16float", "write")
            },
            `
                fn hash22(p: vec2<f32>) -> vec2<f32> {
                    var p3 = fract(vec3<f32>(p.xyx) * vec3<f32>(0.1031, 0.1030, 0.0973));
                    p3 += dot(p3, p3.yzx + 33.33);
                    return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
                }

                fn perlinNoise(p: vec2<f32>) -> f32 {
                    let pi = floor(p);
                    let pf = fract(p);
                    let w = pf * pf * (3.0 - 2.0 * pf);

                    let g00 = dot(hash22(pi + vec2<f32>(0.0, 0.0)), pf - vec2<f32>(0.0, 0.0));
                    let g10 = dot(hash22(pi + vec2<f32>(1.0, 0.0)), pf - vec2<f32>(1.0, 0.0));
                    let g01 = dot(hash22(pi + vec2<f32>(0.0, 1.0)), pf - vec2<f32>(0.0, 1.0));
                    let g11 = dot(hash22(pi + vec2<f32>(1.0, 1.0)), pf - vec2<f32>(1.0, 1.0));

                    let nx0 = mix(g00, g10, w.x);
                    let nx1 = mix(g01, g11, w.x);
                    return mix(nx0, nx1, w.y) * 0.5 + 0.5;
                }

                @compute @workgroup_size(16, 16, 1)
                fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                    let dims = textureDimensions(u_outputTex);
                    if (id.x >= dims.x || id.y >= dims.y) { return; }

                    let time = u_params.x;
                    let scale = u_params.y;
                    let uv = vec2<f32>(id.xy) / vec2<f32>(dims);
                    let st = uv * scale;

                    let n1 = perlinNoise(st + vec2<f32>(time * 0.1, time * 0.05));
                    let n2 = perlinNoise(st * 2.0 - vec2<f32>(time * 0.15, time * 0.08)) * 0.5;
                    let val = (n1 + n2) / 1.5;

                    textureStore(u_outputTex, vec2<i32>(id.xy), vec4<f32>(val, val, val, 1.0));
                }
            `,
            [16, 16, 1]
        );

        // ------------------------------------------------------------------
        // KERNEL 2: GPU MARCHING SQUARES ISO-SURFACE CONTOUR EXTRACTOR
        // ------------------------------------------------------------------
        const marchingKernel = new ComputeKernel(
            {
                "u_params": Res.uniform("vec4<f32>", paramsBuffer),
                "u_noiseTex": Res.texture(noiseTarget.texture!.createView()),
                "u_marchingTex": Res.storageTexture(marchingTarget.storageView!, "rgba16float", "write")
            },
            `
                @compute @workgroup_size(16, 16, 1)
                fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                    let dims = textureDimensions(u_marchingTex);
                    if (id.x >= dims.x || id.y >= dims.y) { return; }

                    let coords = vec2<i32>(id.xy);
                    let threshold = u_params.z; // 0.5

                    let v00 = textureLoad(u_noiseTex, coords + vec2<i32>(0, 0), 0).r;
                    let v10 = textureLoad(u_noiseTex, coords + vec2<i32>(1, 0), 0).r;
                    let v11 = textureLoad(u_noiseTex, coords + vec2<i32>(1, 1), 0).r;
                    let v01 = textureLoad(u_noiseTex, coords + vec2<i32>(0, 1), 0).r;

                    var state = 0u;
                    if (v00 >= threshold) { state |= 1u; }
                    if (v10 >= threshold) { state |= 2u; }
                    if (v11 >= threshold) { state |= 4u; }
                    if (v01 >= threshold) { state |= 8u; }

                    var outColor = vec4<f32>(0.04, 0.08, 0.16, 1.0);

                    if (state == 15u) {
                        outColor = vec4<f32>(0.12, 0.42, 0.72, 1.0);
                    } else if (state > 0u) {
                        outColor = vec4<f32>(1.0, 0.85, 0.15, 1.0);
                    }

                    textureStore(u_marchingTex, coords, outColor);
                }
            `,
            [16, 16, 1]
        );

        // ------------------------------------------------------------------
        // PIPELINE LAYOUT (3D MESH AT CENTER BETWEEN NOISE & MARCHING SQUARES)
        // ------------------------------------------------------------------
        const PANEL_SIZE = 3.6;
        const SPACING = 5.2;

        // Stage 1: Raw 2D Perlin Noise Texture (Left)
        const noiseSprite = new Sprite(PANEL_SIZE, PANEL_SIZE, noiseTarget.texture!);
        noiseSprite.transform.position.set([-SPACING, 0, 0]);
        this.add(noiseSprite);

        // Stage 2: Dynamic 3D Extruded Surface Mesh (CENTER)
        const initialMesh = createDynamicExtrudedMesh(PANEL_SIZE, PANEL_SIZE, 48, 0);
        const extrudedModel = new Model(initialMesh);
        extrudedModel.transform.position.set([0, 0, 0]);
        extrudedModel.material.color = new Color(0.15, 0.65, 0.95, 1.0).rgba;
        extrudedModel.material.roughness = 0.25;
        extrudedModel.material.metallic = 0.35;
        this.add(extrudedModel);

        // Stage 3: GPU Marching Squares Contour Surface (Right)
        const marchingSprite = new Sprite(PANEL_SIZE, PANEL_SIZE, marchingTarget.texture!);
        marchingSprite.transform.position.set([SPACING, 0, 0]);
        this.add(marchingSprite);

        // ------------------------------------------------------------------
        // ANIMATION & COMPUTE DISPATCH LOOP
        // ------------------------------------------------------------------
        const paramsData = new Float32Array(4);
        paramsData[1] = 4.0; // Noise scale
        paramsData[2] = 0.5; // Iso-level threshold

        this.always(() => {
            const time = this.time * 0.0008;
            paramsData[0] = time; // Time
            this.device.queue.writeBuffer(paramsBuffer, 0, paramsData.buffer);

            // 1. Animate 3D Extruded Mesh dynamically at Center
            const animatedMesh = createDynamicExtrudedMesh(PANEL_SIZE, PANEL_SIZE, 48, time);
            extrudedModel.setMesh(animatedMesh);

            // 2. Dispatch GPU Pass 1 (Noise) & GPU Pass 2 (Marching Squares)
            const cmd1 = noiseKernel.dispatch(this.device, GRID_RES / 16, GRID_RES / 16, 1);
            this.addCompute(cmd1);

            const cmd2 = marchingKernel.dispatch(this.device, GRID_RES / 16, GRID_RES / 16, 1);
            this.addCompute(cmd2);

            this.invalidate();
        });
    }
}
