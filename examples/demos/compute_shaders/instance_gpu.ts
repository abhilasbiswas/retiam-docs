import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene,
    Color,
    createBuffer,
    Math3D,
    Res,
    Circle,
    Model,
    Shader,
    OrbitCameraController,
    ComputeKernel,
    Instanced
} from "retiam";


export default class MegaInstanceScene extends Scene {
    public async run() {
        this.camera.position.set([0, 20, 150]);
        new OrbitCameraController(this, this.camera, { radius: 180 });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "150,000 GPU instances", "Models · circles · custom shaders");

        const instanceCount = 50_000; // 50k for each type (150,000 total objects!)

        // ----------------------------------------------------
        // 1. Instance a 3D PBR Model
        // ----------------------------------------------------
        const baseCube = new Model(Math3D.createCube(0.5));
        baseCube.material.color = new Float32Array([1.0, 1.0, 1.0]);
        baseCube.material.roughness = 0.2;

        const instancedCubes = new Instanced(baseCube, instanceCount);
        this.add(instancedCubes);

        // ----------------------------------------------------
        // 2. Instance a 2D Circle
        // ----------------------------------------------------
        const baseCircle = new Circle(0.5);
        baseCircle.paint.fill = Color.WHITE;

        const instancedCircles = new Instanced(baseCircle, instanceCount);
        this.add(instancedCircles);

        // ----------------------------------------------------
        // 3. Instance a Custom Shader
        // ----------------------------------------------------
        const baseShader = new Shader(1.0, 1.0, `
            let dist = length(input.uv - 0.5) * 2.0;
            let ring = abs(sin(dist * 20.0 - state.t1 * 10.0));
            finalColor = vec4f(ring, ring, ring, 1.0);
        `);

        const instancedShaders = new Instanced(baseShader, instanceCount);
        this.add(instancedShaders);

        // ===================================================================
        // COMPUTE SHADER ANIMATION
        // ===================================================================
        instancedCubes.geo.prepare(this);
        instancedCircles.geo.prepare(this);
        instancedShaders.geo.prepare(this);

        const timeBuffer = createBuffer(this.device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 4);

        // FIX: Correctly indexing the array<vec4f> instead of using struct properties
        const computeLogic = `
            let idx = global_id.x;
            if (idx >= ${instanceCount}u) { return; }

            let time = params.x;

            // Read Position & Scale (vec4f)
            var posScale = instances[idx * 3u + 0u];

            // Layout particles in a massive swirling ring
            let fIdx = f32(idx);
            let radius = 10.0 + (fIdx % 1000.0) * 0.05;
            let angle = fIdx * 0.1 + time * (1.0 - radius * 0.01);

            posScale.x = cos(angle) * radius;
            posScale.z = sin(angle) * radius;
            posScale.y = sin(time * 2.0 + radius) * 5.0 + Y_OFFSET;

            // Write back Position & Scale
            instances[idx * 3u + 0u] = posScale;

            // Write back Color (vec4f)
            instances[idx * 3u + 1u] = vec4f(
                sin(angle + time) * 0.5 + 0.5,
                cos(angle + time) * 0.5 + 0.5,
                sin(angle - time) * 0.5 + 0.5,
                1.0
            );
        `;

        const createKernel = (buffer: GPUBuffer, yOffset: number) => {
            return new ComputeKernel({
                "instances": Res.buffer("array<vec4f>", buffer, "read_write"),
                "params": Res.uniform("vec4f", timeBuffer)
            }, computeLogic.replace('Y_OFFSET', yOffset.toFixed(1)), [64, 1, 1]);
        };

        const kernelCubes = createKernel(instancedCubes.getInstanceGPUBuffer(), 20.0);
        const kernelCircles = createKernel(instancedCircles.getInstanceGPUBuffer(), 0.0);
        const kernelShaders = createKernel(instancedShaders.getInstanceGPUBuffer(), -20.0);

        const timeArray = new Float32Array(1);
        const workgroupCount = Math.ceil(instanceCount / 64);

        this.always(() => {
            timeArray[0] = this.time * 0.001;
            this.device.queue.writeBuffer(timeBuffer, 0, timeArray);

            this.addCompute(kernelCubes.dispatch(this.device, workgroupCount));
            this.addCompute(kernelCircles.dispatch(this.device, workgroupCount));
            this.addCompute(kernelShaders.dispatch(this.device, workgroupCount));

            this.invalidate();
        });
    }
}
