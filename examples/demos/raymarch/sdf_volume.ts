import { demoBackground, frameContent, demoCaption } from "../../shared/presentation";
import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, SDFVolume, OrbitCameraController, VGroup } from "retiam";


export default class SDFTestScene extends Scene {
    private volumes: SDFVolume[] = [];

    public async run() {
        // Position camera back far enough to see the whole 4x4 grid
        this.camera.position.set([0, 0, 30]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        demoCaption(this, "A gallery of signed-distance forms", "Solid surfaces defined by mathematical distance fields");

        const group = new VGroup();

        // Helper to quickly instantiate SDF tests
        const addSDF = (logic: string, color: Color, roughness: number = 0.2, metallic: number = 0.1) => {
            // A 3x3x3 bounds is perfect for 1-unit sized primitives
            const vol = new SDFVolume(3, 3, 3, logic);
            vol.material.color = color.rgba;
            vol.material.roughness = roughness;
            vol.material.metallic = metallic;

            this.volumes.push(vol);
            group.add(vol);
            return vol;
        };

        // --- 1. BASIC PRIMITIVES ---

        addSDF(`return sdSphere(p, 1.0);`, new Color(1.0, 0.2, 0.2));
        addSDF(`return sdBox(p, vec3<f32>(0.8));`, new Color(0.2, 1.0, 0.2));
        addSDF(`return sdRoundBox(p, vec3<f32>(0.6), 0.25);`, new Color(0.2, 0.2, 1.0));
        addSDF(`return sdBoxFrame(p, vec3<f32>(0.8), 0.1);`, new Color(1.0, 1.0, 0.2));

        addSDF(`return sdTorus(p, vec2<f32>(0.8, 0.3));`, new Color(1.0, 0.2, 1.0));
        addSDF(`return sdCappedTorus(p, vec2<f32>(0.866025, -0.5), 0.8, 0.2);`, new Color(0.2, 1.0, 1.0));
        addSDF(`return sdLink(p, 0.4, 0.5, 0.2);`, new Color(1.0, 0.5, 0.2));
        addSDF(`return sdCappedCylinder(p, 1.0, 0.5);`, new Color(0.5, 1.0, 0.2));

        addSDF(`return sdCapsule(p, vec3<f32>(-0.6, -0.6, 0.0), vec3<f32>(0.6, 0.6, 0.0), 0.3);`, new Color(0.2, 0.5, 1.0));
        addSDF(`return sdCone(p, normalize(vec2<f32>(0.5, 1.0)), 1.0);`, new Color(1.0, 0.2, 0.5));
        addSDF(`return sdOctahedron(p, 1.0);`, new Color(0.5, 0.2, 1.0));
        addSDF(`return sdPyramid(p, 1.0);`, new Color(0.8, 1.0, 0.5));

        // --- 2. BOOLEAN OPERATIONS & DOMAIN MODIFICATIONS ---

        // Smooth Union (Melting Drops)
        addSDF(`
            let drop1 = sdSphere(p - vec3<f32>(sin(state.t1) * 0.8, 0.0, 0.0), 0.6);
            let drop2 = sdBox(p, vec3<f32>(0.5));
            return opSmoothUnion(drop1, drop2, 0.3);
        `, new Color(1.0, 0.8, 0.0), 0.1, 0.8); // Make it look like liquid gold!

        // Smooth Subtraction (Bite out of an apple)
        addSDF(`
            let bite = sdSphere(p - vec3<f32>(sin(state.t1) * 0.8, 0.0, 0.0), 0.7);
            let apple = sdSphere(p, 1.0);
            return opSmoothSubtraction(bite, apple, 0.2);
        `, new Color(0.9, 0.1, 0.1));

        // Domain Repetition (A grid of tiny shapes)
        addSDF(`
            // Repeat space, limited to a 3x3x3 grid
            let q = opRepLim(p, 0.6, vec3<f32>(1.0, 1.0, 1.0));
            // A pulsating sphere
            let radius = 0.15 + sin(state.t1 * 2.0) * 0.05;
            return sdSphere(q, radius);
        `, new Color(0.2, 0.8, 1.0));

        // Domain Onion (Hollow Shell with an open cut)
        const hollow = addSDF(`
            let shape = sdTorus(p, vec2<f32>(0.8, 0.4));

            // Hollow it out like a shell
            let shell = opOnion(shape, 0.05);

            // Cut off the front half using intersection with a plane (p.z > 0)
            return opIntersection(shell, p.z);
        `, new Color(0.6, 0.2, 1.0));
        hollow.material.emColor = new Color(0.4, 0.1, 1.0).rgba;
        hollow.material.emStrength = 1.0; // Give the inside a subtle glow

        // --- 3. LAYOUT & ANIMATION ---

        // Arrange the 16 items into a 4x4 grid with a spacing of 4.0 units
        group.arrangeInGrid(4, 4, 4.0);
        this.add(group);
        frameContent(this, group, 0.35);

        // Continuous Animation Loop
        this.always(() => {
            for (let vol of this.volumes) {
                // Pass elapsed time into the shader via state.t1
                vol.state.t1 = this.time * 0.003;

                // Slowly spin each shape to show off 3D depth and PBR reflections
                vol.transform.rotateWorldY(this.dt * 0.0005);
                vol.transform.rotateWorldX(this.dt * 0.0003);
            }
            this.invalidate(); // Request redraw
        });
    }
}
