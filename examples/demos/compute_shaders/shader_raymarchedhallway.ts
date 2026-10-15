import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, SDFVolume, OrbitCameraController, VGroup, Shader } from "retiam";


export default class RaymarchedHallwayScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 180, 116);
        demoCaption(this, "Raymarched hallway", "A continuous journey through a twisting cube field");

        const userFunctions = `
            // 2D Rotation Matrix
            fn rot2D(a: f32) -> mat2x2<f32> {
                let s = sin(a);
                let c = cos(a);
                return mat2x2<f32>(c, -s, s, c);
            }

            // SDF defining an infinite twisting tunnel of cubes
            fn map(p_in: vec3<f32>, t: f32) -> f32 {
                var p = p_in;

                // Infinite forward movement
                p.z += t * 3.0;

                // Twist the hallway
                p.x += sin(t * 0.5 + p.z * 0.2);
                p.y += cos(t * 0.3 + p.z * 0.2);

                // Modulo operator for repeating grid
                let q = fract(p) - 0.5;

                // Box SDF
                let box = abs(q) - vec3<f32>(0.15);
                return length(max(box, vec3<f32>(0.0))) + min(max(box.x, max(box.y, box.z)), 0.0);
            }
        `;

        const fragmentLogic = `
            let aspect = view.size.x / view.size.y;
            let screenUV = (input.uv * 2.0 - 1.0) * vec2f(aspect, 1.0);
            let t = view.time * 0.001;

            // Setup Ray Origin and Direction
            var ro = vec3f(0.0, 0.0, -1.0);
            var rd = normalize(vec3f(screenUV, 1.0));

            // --- THE FIX ---
            // Calculate the rotated XY first, then reconstruct the vec3f.
            // Avoids the strict WGSL swizzle assignment error!
            let rotated_xy = rot2D(t * 0.2) * rd.xy;
            rd = vec3f(rotated_xy, rd.z);

            var dO = 0.0;
            var dS = 0.0;
            var p = ro;
            var i = 0;

            // Raymarching Loop
            for(i = 0; i < 80; i++) {
                p = ro + rd * dO;
                dS = map(p, t);
                dO += dS;
                if(dS < 0.001 || dO > 50.0) { break; }
            }

            var col = vec3f(0.0);

            // Shading and Fog
            if(dO < 50.0) {
                let depth = 1.0 - (dO / 50.0);
                let iterationGlow = f32(i) / 80.0;

                // Cyberpunk coloring based on iteration count & depth
                col = vec3f(0.9, 0.1, 0.5) * iterationGlow * 2.0;
                col += vec3f(0.1, 0.8, 0.9) * depth;
            }

            finalColor = vec4f(col / (vec3f(1.0) + col), 1.0);
        `;

        const shader = new Shader(160, 90, fragmentLogic, { userFunctions });

        // Scale it up nicely for the screen
        shader.transform.scale(1.0);
        this.add(shader);
    }
}
