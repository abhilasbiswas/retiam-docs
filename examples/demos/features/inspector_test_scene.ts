import { frameStage } from "../../shared/presentation";
import { Scene, Color, Vec2, Create, Text, Poly, Path, Rate, Write, CameraController, Builder, Circle, CENTER, JointType, writeAnim } from "retiam";

export default class InspectorTestSuiteScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        // 1. Camera & View Settings (Triggers Camera Inspector)
        this.camera.position.set([0, 0, 25]);
        frameStage(this, 22, 16);
        const controller = new CameraController(this, this.camera);
        controller.sensitivity = 0.5; // Overall sensitivity multiplier (1.0 = 100% standard speed)
        controller.scrollSensitivity = 0.3; // Standard scroll speed (1.0 = default)

        // 2. Background & Colors (Triggers Color Inspector)
        const primaryColor = Color.fromHex("#38bdf8");
        const secondaryColor = Color.fromHex("#2563eb");

        // 3. Typography & Text Options (Triggers Typography Inspector)
        const titleText = new Text("Retiam Studio", {
            fontSize: 2.2,
            fontFamily: "Inter",
            textAlign: "center",
            stroke: Color.fromHex("#9bff7d"),
            strokeWidth: 0.015,
            joint: JointType.MITER,
            anchor: CENTER
        });
        titleText.paint.fill = primaryColor;

        // 4. Vector Coordinates (Triggers Vector Inspector)
        const centerPos = new Vec2(0, 4);
        titleText.setPosition([centerPos.x, centerPos.y, 0]);

        // 5. Geometry & Polygons (Triggers Poly Geometry Inspector)
        const polygonShape = new Builder().regular(6, 3.0).build({
            anchor: CENTER,
            stroke: Color.fromHex("#89c1ff"),
            strokeWidth: 0.12,
            opacity: 0.5
        });
        polygonShape.paint.fill = secondaryColor;

        // 6. Transform Controls (Triggers Transform Inspector)
        polygonShape.setPosition([0, -2.5, 1]).setScale([1.2, 1.2]);

        polygonShape.setEvent("click", () => {
            console.log("clicked");
        });

        // 7. Path Stroke & Contour (Triggers Path & Stroke Inspector)
        const builder = new Builder();
        builder.moveTo(-6.7, 2.7).lineTo(6.9, 2.7);
        const strokePath = new Path(builder.toString());
        strokePath.setStrokeCap("round").setStrokeJoin("miter");
        strokePath.paint.setStroke(0.15, primaryColor);

        const circle = new Circle(1, { position: [0, -2.5, 1], fill: Color.fromHex("#beffbb") });

        // 8. Animation Choreography (Triggers AnimOptions & Timeline Inspectors)
        await this.play(new Write([titleText, strokePath]), {
            duration: 2000,
            rate_func: Rate.easeInOutCubic()
        });

        await this.play(new Create([polygonShape]), {
            duration: 1200,
            rate_func: Rate.easeInOutSine()
        });

        await this.play(writeAnim(circle));
    }
}
