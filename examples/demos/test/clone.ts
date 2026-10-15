import { frameStage, demoCaption } from "../../shared/presentation";
import { Text, Axes, CameraController, Circle, Color, Create, CustomAnimation, Entity, FunctionGraph2D, Concurrent, MathShape3D, ParametricCurve2D, ParametricCurve3D, Poly, Rate, Rect, Scene, SDFText, SurfaceGraph3D, Tex, ThreeDAxes, Torus, TracePath, TransformMatchingText, UP, Vec2, Vec3, VectorField2D, VGroup, Write, FadeIn, VectorTransform } from "retiam"


export default class Clone extends Scene {
    public async run() {
        frameStage(this, 55, 38);
        demoCaption(this, "Clone and transform", "The copy moves independently of its source");
        let circle = new Circle(10,
            {
                stroke: Color.GREEN,
                opacity: 0.5,
                strokeWidth: 1,
                fill: Color.NONE
            });

        await this.play(new Create(circle));

        let circle2 = circle.clone();
        this.play(circle2.animate.move([10, 0, 0]));


    }
}
