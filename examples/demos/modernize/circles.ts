import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene, OrbitCameraController, Vec3, Color, Circle
} from "retiam";

export default class TestScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 230]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Transparent depth sorting", "1,000 circles moving through three-dimensional space");

        const particles: { shape: Circle, speed: number, radius: number, offset: number }[] = [];

        // Spawn 200 overlapping transparent circles
        for(let i=0; i<1000; i++) {
            const shape = new Circle(Math.random() * 3 + 1);

            // Random vibrant colors with 50% opacity
            shape.paint.fill = new Color(Math.random(), Math.random(), Math.random(), 0.5);

            this.add(shape);

            particles.push({
                shape: shape,
                speed: (Math.random() - 0.5) * 0.005,
                radius: Math.random() * 50,
                offset: Math.random() * Math.PI * 2
            });
        }

        // Animate them continuously so the depths change every frame
        this.always(() => {
            particles.forEach((p) => {
                const angle = (this.time * p.speed) + p.offset;
                // Move them in 3D space to force continuous depth sorting
                p.shape.transform.position = new Vec3(
                    Math.cos(angle) * p.radius,
                    Math.sin(angle * 1.5) * p.radius, // Add some vertical wobble
                    Math.sin(angle) * p.radius
                );
            });
            this.invalidate();
        });
    }
}
