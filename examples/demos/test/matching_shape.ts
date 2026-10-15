// MorphDemoScene.ts
import { Scene, CameraController, Text, Vec3, Line3D, CapType, Color, Rect, JointType, Line, Vec2, Circle, Create, Rate, RIGHT, Triangle, VGroup, Builder, TransformMatchingShapes } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera
        this.camera.position.set([0, 0, 45]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark slate background

        // =========================================================================
        // 2. Build Master Templates (Keep these pristine and do not add to scene)
        // =========================================================================
        const builderA = new Builder();
        builderA.roundedRect(-4, -4, 8, 8, 2);
        const shapeA = builderA.build();
        shapeA.paint.fill = new Color(0.2, 0.6, 1.0, 1.0); // Blue
        shapeA.paint.stroke = Color.WHITE;
        shapeA.paint.strokeWidth = 0.15;
        shapeA.transform.position = new Vec3(-12, -5, 0);
        shapeA.transform.setRotationZ(Math.PI / 4);
        shapeA.transform.setScale(1.0);

        const builderB = new Builder();
        builderB.star(0, 0, 5, 5, 2.5);
        const shapeB = builderB.build();
        shapeB.paint.fill = new Color(1.0, 0.8, 0.2, 1.0); // Gold
        shapeB.paint.stroke = Color.WHITE;
        shapeB.paint.strokeWidth = 0.15;
        shapeB.transform.position = new Vec3(12, 5, 0);
        shapeB.transform.setRotationZ(-Math.PI / 6);
        shapeB.transform.setScale(1.5);

        const builderC = new Builder();
        builderC.circle(0, 0, 4);
        const shapeC = builderC.build();
        shapeC.paint.fill = new Color(1.0, 0.2, 0.5, 1.0); // Pink
        shapeC.paint.stroke = Color.WHITE;
        shapeC.paint.strokeWidth = 0.15;
        shapeC.transform.position = new Vec3(0, 10, 0);
        shapeC.transform.setRotationZ(0);
        shapeC.transform.setScale(0.8);

        // =========================================================================
        // 3. Run the Animation Sequence using Clones
        // =========================================================================

        // Spawn and add a clone of the first shape
        let current = shapeA.clone();
        this.add(current);
        await this.wait(1000);

        while (true) {
            // Morph Current -> B (Creates a fresh clone of B)
            const targetB = shapeB.clone();
            await this.play(new TransformMatchingShapes(current, targetB, {
                duration: 2000,
                rate_func: Rate.easeInOutCubic()
            }));
            current = targetB; // Hand over reference (the previous 'current' is now destroyed)
            await this.wait(1000);

            // Morph B -> C
            const targetC = shapeC.clone();
            await this.play(new TransformMatchingShapes(current, targetC, {
                duration: 2000,
                rate_func: Rate.easeInOutCubic()
            }));
            current = targetC;
            await this.wait(1000);

            // Morph C -> A
            const targetA = shapeA.clone();
            await this.play(new TransformMatchingShapes(current, targetA, {
                duration: 2000,
                rate_func: Rate.easeInOutCubic()
            }));
            current = targetA;
            await this.wait(1000);
        }
    }
}
