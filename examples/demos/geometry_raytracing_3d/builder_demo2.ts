import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { env } from "process";
import { Scene, CameraController, Color, light, Plane, Vec3, Box } from "retiam";

export default class Shadow2DScene extends Scene {
    public async run() {
        // 1. Setup Camera for a slightly angled "2.5D" isometric view
        this.camera.position.set([0, 15, 60]);
        this.camera.pitch = -0.15;
        new CameraController(this, this.camera);
        framePerspective(this);
        demoCaption(this, "Extruded shapes in motion", "A shared light reveals depth and surface orientation");

        // 2. Configure Environment & Lighting
        this.clearColor(demoBackground()); // Soft paper-like background
        // env.skyColor = new Color(1.0, 1.0, 1.0, 1.0);
        // env.groundColor = new Color(0.8, 0.8, 0.85, 1.0);

        // Start the light to the top-left
        light.position.set([-40, 50, 40]);
        light.color = new Color(1.5, 1.4, 1.3, 1.0); // Warm sunlight

        // 3. Create the "Canvas" Background (Receives Shadows)
        const wall = new Plane(150, 100);
        wall.transform.position = new Vec3(0, 10, -15);
        wall.transform.setRotationX(Math.PI / 2); // Stand it upright
        wall.material.color = new Color(0.20, 0.25, 0.34, 1.0);
        wall.material.roughness = 1.0;
        wall.RECEIVE_SHADOW = true;
        this.add(wall);

        const floor = new Plane(150, 100);
        floor.transform.position = new Vec3(0, -15, 20);
        floor.material.color = new Color(0.12, 0.17, 0.25, 1.0);
        floor.material.roughness = 0.8;
        floor.RECEIVE_SHADOW = true;
        this.add(floor);

        // 4. Create Flat "2D" Models floating in front of the wall
        const flatShapes: Box[] = [];
        const colors = [
            new Color(1.0, 0.2, 0.4, 1.0), // Red/Pink
            new Color(0.2, 0.8, 1.0, 1.0), // Cyan
            new Color(1.0, 0.8, 0.1, 1.0), // Yellow
            new Color(0.4, 0.9, 0.4, 1.0), // Green
            new Color(0.6, 0.3, 1.0, 1.0)  // Purple
        ];

        // We use a very thin Box instead of a Plane so it casts a solid, double-sided shadow
        for (let i = 0; i < 5; i++) {
            const shape = new Box(8, 8, 0.2);
            shape.transform.position = new Vec3((i - 2) * 12, 0, 0);

            shape.material.color = colors[i];
            shape.material.roughness = 0.3; // Slight gloss
            shape.material.metallic = 0.1;

            // Enable shadow properties!
            shape.CAST_SHADOW = true;
            shape.RECEIVE_SHADOW = true;

            this.add(shape);
            flatShapes.push(shape);
        }

        // 5. Add a floating frame to cast a complex shadow over the shapes
        const frame = new Box(60, 2, 0.5);
        frame.transform.position = new Vec3(0, 12, 8);
        frame.material.color = new Color(0.1, 0.1, 0.15, 1.0);
        frame.CAST_SHADOW = true;
        this.add(frame);

        // 6. Animation Loop
        this.always(() => {
            const t = this.time * 0.001;

            // Sweep the light back and forth to show off dynamic shadow casting
            light.position.x = Math.sin(t * 0.5) * 60;
            light.position.y = 40 + Math.cos(t * 0.8) * 10;
            light.position.z = 30 + Math.sin(t * 0.3) * 20;

            // Animate the flat shapes doing a "card flip" wave
            flatShapes.forEach((shape, index) => {
                const offset = index * 0.4;

                // Hover up and down
                shape.transform.position.y = Math.sin(t * 2.0 + offset) * 3;
                shape.transform.position.z = Math.sin(t * 1.5 + offset) * 4;

                // Spin like flat 2D cards
                shape.transform.setRotationY(t * 1.2 + offset);
                shape.transform.setRotationX(Math.sin(t + offset) * 0.5);
            });

            this.invalidate(); // Keep the render loop running smoothly
        });
    }
}
