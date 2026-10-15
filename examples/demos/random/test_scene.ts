import { frameStage, demoCaption } from "../../shared/presentation";
import {
    Scene,
    Color,
    hex,
    Rate,
    Rect,
    Arrow,
    SDFText,
    VBox,
    HBox,
    VGroup,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    ORIGIN,
    CENTER,
    Write,
    FadeIn,
    FadeOut,
    Create,
    DrawBorderThenFill,
    GroupAnimator,
    Entity,
    BLACK,
    WHITE,
    ChalkEffect,
    NONE,
    SDFCircle,
    RED
} from "retiam";
import { Circumscribe } from "retiam/highlights";

export default class BinarySearchScene extends Scene {
    public async run(): Promise<void> {
        frameStage(this, 48, 50);
        demoCaption(this, "Vector and SDF contours", "Two rendering paths with matching silhouettes");

        let rect = new Rect(20, 30, { stroke: WHITE, strokeWidth: 5, fill: NONE })

        rect.setPathEffect(new ChalkEffect())

        this.add(rect);

        let circle = new SDFCircle(10, { strokeWidth: 2, stroke: RED.alpha(0.5) });
        this.add(circle);
    }
}
