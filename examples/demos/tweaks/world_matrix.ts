import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, RaymarchedPlot3D, OrbitCameraController, Color, ParametricColorMode, SDFText, SurfaceViewStyle, ThreeDAxes, Vec3, RaymarchStyle, RaymarchColorMode, CameraModel, Entity, Rect, Line, Circle } from "retiam";

export default class TestScene_WorldMatrix extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 150]);
        new CameraController(this, this.camera);
        frameStage(this, 140, 140);
        demoCaption(this, "A hierarchy of 1,000 transforms", "A rotating chain carries a marker at its endpoint");

        // Create a deep hierarchy chain
        const DEPTH = 1000;
        let root = new Entity();
        this.add(root);
        root.add(new Line([[0, 0], [DEPTH * 0.05, 0]], {
            stroke: Color.fromHex("#334155"), strokeWidth: 0.5,
        }));
        root.add(new Circle(1.5, { fill: Color.fromHex("#f59e0b"), strokeWidth: 0 }));

        let currentParent = root;
        for (let i = 0; i < DEPTH; i++) {
            let child = new Entity();
            // Shift each child slightly to the right to form a long arm
            child.transform.position = [0.05, 0, 0];
            currentParent.add(child);
            currentParent = child;
        }

        // Attach a visual marker to the very end of the chain
        const leafMarker = new Rect(4, 4);
        leafMarker.paint.fill = Color.fromHex("#38bdf8");
        currentParent.add(leafMarker);

        // Animate the root. This forces the entire chain to recalculate naturally.
        this.always(() => {
            root.transform.rotateWorldZ(this.dt * 0.001);

            // STRESS TEST: Query the leaf node's world transform 10,000 times!
            // If caching works, this will run at 60fps effortlessly.
            let latestPos;
            for(let i = 0; i < 10000; i++) {
                const wt = leafMarker.getWorldTransform();
                latestPos = wt.matrix.getTranslate();
            }

            this.invalidate(); // Force redraw
        });
    }
}
