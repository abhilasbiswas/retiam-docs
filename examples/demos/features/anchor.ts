import { frameStage, demoCaption } from "../../shared/presentation";

import { Scene, Text, Color, CameraController, Circle, UP, Rect, LEFT, VGroup, ORIGIN, RIGHT, DOWN, UL, UR, DL, DR, CENTER, OrbitCameraController, Vec3, RED } from "retiam";

export default class LayoutTestScene extends Scene {
    public async run() {

        this.camera.position.set([0, 0, 120]);
        new OrbitCameraController(this, this.camera)
        frameStage(this, 100, 100);
        demoCaption(this, "Rotation around an anchor", "The markers compare local and world coordinates");
        let parent = new Rect(50, 50, { fill: Color.fromHex("#1e293b") })
        let rect = new Rect(20, 20, { fill: Color.fromHex("#38bdf8") });

        parent.add(rect)

        parent.move([-20, -40, 0], DL);
        // rect.move([0, 0, 0], DL);

        this.add(parent)

        // Dynamically animate a scale around an anchor
        // Note: Animate expects explicit coordinates, not edges, so we grab it from the boundary
        // let pivot = rect.getBoundaryPoint(UL);

        // rect.rotate(Math.PI/4, DL)
        let p = rect.localToWorld(new Vec3(rect.getVertex(4)));//[15, 5, 0]
        this.add(new Circle(1, { position: rect.getPosition(p), fill: Color.RED }));


        this.add(new Circle(1, { position: p, fill: Color.BLUE }));

        await this.play(
            rect.animate.rotate(Math.PI / 2, { pivot: p })
        );

        // await this.play(
        //     rect.animate.rotate(Math.PI / 2, ORIGIN)
        // );

        // rect.transform.scaleWithAnchor(2.0, pivot)
    }
}
