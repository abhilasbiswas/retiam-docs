import { frameStage, demoCaption } from "../../shared/presentation";
import { Text, Axes, CameraController, Circle, Color, Create, CustomAnimation, Entity, FunctionGraph2D, Concurrent, MathShape3D, ParametricCurve2D, ParametricCurve3D, Poly, Rate, Rect, Scene, SDFText, SurfaceGraph3D, Tex, ThreeDAxes, Torus, TracePath, TransformMatchingText, UP, Vec2, Vec3, VectorField2D, VGroup, Write, FadeIn, VectorTransform, CameraModel, PolarAxes, MatchingPolicy } from "retiam"


export default class Transform extends Scene {
    public async run() {
        this.camera.toOrtho();
        new CameraController(this, this.camera)
        frameStage(this, 105, 110);
        demoCaption(this, "Polar coordinates", "Radial and angular guides in a shared coordinate system");
        let axex = new Axes({ scale: 1, gridColor: Color.GREY, strokeWidth: 0.5 });
        await this.play(new Write(axex), { duration: 1000 });


        let polar = new PolarAxes({ rMax: 50, radius: 40, strokeWidth: 0.3 });

        // this.add(polar.clone().moveTo([10,0,0]))

        this.play(new VectorTransform(axex, polar), { duration: 1000, rate_func: Rate.easeInOutExpo() });

    }
}
