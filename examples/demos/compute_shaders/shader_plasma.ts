import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, SDFVolume, OrbitCameraController, VGroup, Shader } from "retiam";


export default class CosmicPlasmaScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 180, 116);
        demoCaption(this, "Cosmic plasma", "Animated domain warping");

        const fragmentLogic = `
            // Map UVs from [0, 1] to [-1, 1] and correct the aspect ratio
            let aspect = view.size.x / view.size.y;
            let uv = (input.uv * 2.0 - 1.0) * vec2f(aspect, 1.0);

            // Convert scene time from milliseconds to seconds
            let t = view.time * 0.001;

            var color = vec3f(0.0);

            // Multi-layered sine wave domain warping
            for(var i: f32 = 1.0; i < 5.0; i += 1.0) {
                var p = uv * i;
                p = vec2f(
                    p.x + sin(t * 0.5 + p.y) * 0.5,
                    p.y + cos(t * 0.3 + p.x) * 0.5
                );

                // Create glowing rings based on warped distance
                let d = length(p) - 0.5;
                let glow = 0.05 / max(abs(d), 0.012);

                // Accumulate colors shifting over time
                color += vec3f(
                    sin(t + i) * 0.5 + 0.5,
                    cos(t * 0.8 + i) * 0.5 + 0.5,
                    sin(t * 1.2 + i * 2.0) * 0.5 + 0.5
                ) * glow;
            }

            // 'finalColor' is defined automatically by your ShaderDomain wrapper
            finalColor = vec4f(color, 1.0);
        `;

        // Create a 160x90 quad (16:9 ratio)
        const plasmaShader = new Shader(160, 90, fragmentLogic);
        this.add(plasmaShader);
    }
}
