import { demoBackground, framePerspective } from "../../shared/presentation";
import { CameraController, Color, Math3D, Model, OrbitCameraController, PostProcessPass, Scene } from "retiam";

export default class VhsShowcase extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);

        // 1. Add some basic 3D objects
        const cube = new Model(Math3D.createCube(5));
        cube.material.color = Color.CYAN.rgba;
        this.add(cube);

        this.always(() => { cube.transform.rotateWorldX(this.dt * 0.001); });

        // 2. Define the VHS / Chromatic Aberration Shader
        const vhsShaderCode = PostProcessPass.getDefaultShader(`
            // 'uv', 'tex', and 'samp' are provided by getDefaultShader()

            // 1. Chromatic Aberration (RGB Split)
            let offset = vec2f(0.005 * sin(view.time * 0.01), 0.0);
            let r = textureSample(tex, samp, uv + offset).r;
            let g = textureSample(tex, samp, uv).g;
            let b = textureSample(tex, samp, uv - offset).b;

            // 2. CRT Scanlines
            let scanline = sin(uv.y * 800.0) * 0.04;

            // 3. Vignette
            let dist = distance(uv, vec2f(0.5));
            let vignette = smoothstep(0.8, 0.3, dist);

            // Output final pixel
            return vec4f((vec3f(r, g, b) - scanline) * vignette, 1.0);
        `);

        // 3. Add the pass to the scene!
        // We pass 'finalOutputHandle' as a dummy. The graph builder will automatically
        // weave this in right before PresentPass!
        const vhsPass = new PostProcessPass("VHS_Filter", this.renderer.finalOutputHandle, vhsShaderCode);
        this.addPass(vhsPass);
    }
}
