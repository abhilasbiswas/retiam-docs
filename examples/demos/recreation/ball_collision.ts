import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Color, Line3D, Vec3, CapType, JointType, Circle, Instanced, ComputeKernel, Res, CameraModel } from "retiam";

// --- COMPUTE SHADER LOGIC ---
const computeWgsl = `
    let NUM_BALLS = u32(params.z);
    let TRAIL_LEN = u32(params.w);

    // 1 thread per ball
    let ball_idx = global_id.x;
    if (ball_idx >= NUM_BALLS) { return; }

    let dt = params.x;
    let time = params.y;

    // Read this specific ball's physics state
    let phys_idx = ball_idx * 8u;
    var p = vec2f(phys[phys_idx + 0u], phys[phys_idx + 1u]);
    var v = vec2f(phys[phys_idx + 2u], phys[phys_idx + 3u]);
    let head = bitcast<u32>(phys[phys_idx + 4u]);

    let base_inst_idx = ball_idx * TRAIL_LEN;

    // 1. Shrink/Fade the trail for THIS ball
    for (var i = 0u; i < TRAIL_LEN; i = i + 1u) {
        if (i != head) {
            let inst_idx = (base_inst_idx + i) * 3u;
            var scale = instances[inst_idx].w;
            if (scale > 0.0) {
                // Shrink particles gradually. When scale hits 0, it vanishes.
                instances[inst_idx].w = max(0.0, scale - 1.2 * dt);
            }
        }
    }

    // 2. Perform Physics Update
    // Apply Gravity
    v.y -= 120.0 * dt;
    p += v * dt;

    // V-Shape Collision Detection
    // The V-shape lines are defined mathematically as y = abs(x) - 30.0
    let surface_y = abs(p.x) - 30.0;

    // Radius of the ball is 1.0, so trigger hit when p.y - 1.0 crosses the surface
    if (p.y - 1.0 < surface_y) {
        p.y = surface_y + 1.0;

        // Calculate the perpendicular normal of the hit side
        let sign_x = sign(p.x);
        let n = normalize(vec2f(-sign_x, 1.0));

        // Reflect velocity vector and apply bounciness friction
        v = v - 2.0 * dot(v, n) * n;
        v *= 1.0;
    }

    // Save physics state back to buffer
    phys[phys_idx + 0u] = p.x;
    phys[phys_idx + 1u] = p.y;
    phys[phys_idx + 2u] = v.x;
    phys[phys_idx + 3u] = v.y;

    // Shift ring buffer head forward
    let new_head = (head + 1u) % TRAIL_LEN;
    phys[phys_idx + 4u] = bitcast<f32>(new_head);

    // Inline HSV to RGB color generation based on the Ball's Index!
    let hue = f32(ball_idx) / f32(NUM_BALLS);
    let c = vec3f(hue, 1.0, 1.0);
    let K = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    let p_hsv = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    let color = c.z * mix(K.xxx, clamp(p_hsv - K.xxx, vec3f(0.0), vec3f(1.0)), c.y);

    // 3. Write new instance to the trail
    let target_inst = (base_inst_idx + new_head) * 3u;
    instances[target_inst + 0u] = vec4f(p.x, p.y, 0.0, 1.0); // Reset scale to 1.0
    instances[target_inst + 1u] = vec4f(color, 1.0);         // Apply color
    instances[target_inst + 2u] = vec4f(0.0, 0.0, 0.0, 1.0); // Default rotation
`;

export default class ChaosScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        // 1. Setup Camera & Environment
        this.camera.position.set([0, 10, 120]);
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = 100;
        new CameraController(this, this.camera);
        frameStage(this, 190, 116, 10);
        demoCaption(this, "Diverging collision trajectories", "Nearly identical starting positions evolve independently");

        // 2. Draw the V-Shape Bounding Box using Line3D (No Fill)
        const vShape = new Line3D([
            new Vec3(-80, 50, 0),
            new Vec3(0, -30, 0),
            new Vec3(80, 50, 0)
        ]);

        vShape.paint.stroke = Color.WHITE;
        vShape.paint.strokeWidth = 2.0;
        vShape.paint.cap = CapType.ROUND;
        vShape.paint.joint = JointType.ROUND;
        this.add(vShape);

        // 3. Setup Instanced Trail
        const NUM_BALLS = 10000;      // 150 independent bouncing balls
        const TRAIL_LEN = 1;       // Each ball leaves a 60-frame trail
        const TOTAL_INSTANCES = NUM_BALLS * TRAIL_LEN; // 9,000 instances total

        const template = new Circle(0.6); // Slightly smaller balls
        template.paint.fill = Color.WHITE;
        const trail = new Instanced(template, TOTAL_INSTANCES);
        this.add(trail);

        trail.geo.prepare(this, trail.state);

        // Hide all particles initially
        for (let i = 0; i < TOTAL_INSTANCES; i++) {
            trail.setInstanceScale(i, 0.0);
        }
        trail.updateInstances();
        trail.geo.prepare(this, trail.state);

        // 4. Setup Compute Kernel for Physics
        const physBuffer = this.device.createBuffer({
            size: NUM_BALLS * 32, // 8 floats per ball
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // Initial Physics State for all balls
        const physData = new Float32Array(NUM_BALLS * 8);
        for (let i = 0; i < NUM_BALLS; i++) {
            // THE CHAOS SEED: A tiny random offset in X and Y (range -0.025 to 0.025).
            // Visually they look like one solid point initially, but this microscopic
            // randomness causes them to diverge wildly off the bouncy slopes.
            const randomOffsetX = (Math.random() - 0.5) * 0.5;
            const randomOffsetY = (Math.random() - 0.5) * 0.5;

            physData[i * 8 + 0] = -40.0 + randomOffsetX; // x position
            physData[i * 8 + 1] = 50.0 + randomOffsetY; // y position
            physData[i * 8 + 2] = 0.0;                 // x velocity
            physData[i * 8 + 3] = -10.0;                 // y velocity
            physData[i * 8 + 4] = 0.0;                 // head_index
        }
        this.device.queue.writeBuffer(physBuffer, 0, physData);

        const paramsBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Initialize Engine's Compute Kernel
        const computeKernel = new ComputeKernel(
            {
                "phys": Res.buffer("array<f32>", physBuffer, "read_write"),
                "instances": Res.buffer("array<vec4<f32>>", trail.getInstanceGPUBuffer(), "read_write"),
                "params": Res.uniform("vec4<f32>", paramsBuffer)
            },
            computeWgsl,
            [64, 1, 1]
        );

        // 5. Update Loop
        this.always(() => {
            const dt = Math.min(this.dt * 0.001, 0.033);
            const time = this.time * 0.001;

            // Upload delta-time and constants to Compute Shader
            this.device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([
                dt, time, NUM_BALLS, TRAIL_LEN
            ]));

            // Dispatch 1 thread per ball!
            const cmd = computeKernel.dispatch(this.device, NUM_BALLS);
            this.addCompute(cmd);

            this.invalidate();
        });
    }
}
