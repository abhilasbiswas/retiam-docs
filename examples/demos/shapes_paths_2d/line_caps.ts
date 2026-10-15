import { Scene, CameraController, Vec3, Line3D, CapType, Color, Rect } from "retiam";
import { demoBackground } from "../../shared/presentation";


export default class LineCapTestingScene extends Scene {
    public async run() {
        // Position camera to look directly at the center
        this.camera.position.set([0, 0, 80]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());

        const points = [
            new Vec3(-20, 0, 0),
            new Vec3(20, 0, 0)
        ];

        const lineButt = new Line3D(points);
        lineButt.transform.move(new Vec3(0, 15, 0));
        lineButt.paint.setStroke(10, new Color(1.0, 0.3, 0.3, 1));
        lineButt.paint.setCap(CapType.BUTT);
        this.add(lineButt);

        const lineSquare = new Line3D(points);
        lineSquare.transform.move(new Vec3(0, 0, 0));
        lineSquare.paint.setStroke(10, new Color(0.3, 1.0, 0.3, 1));
        lineSquare.paint.setCap(CapType.SQUARE);
        this.add(lineSquare);

        const lineRound = new Line3D(points);
        lineRound.transform.move(new Vec3(0, -15, 0));
        lineRound.paint.setStroke(10, new Color(0.3, 0.5, 1.0, 1));
        lineRound.paint.setCap(CapType.ROUND);
        this.add(lineRound);

        this.always(() => {
            const rotY = this.time * 0.001;
            lineButt.transform.setRotationY(rotY);
            lineSquare.transform.setRotationY(rotY);
            lineRound.transform.setRotationY(rotY);

            // Re-render continuously
            this.invalidate();
        });
    }
}
