import { CameraModel, CustomFillEffect, FadeIn, Rect, Scene, hex } from 'retiam';

/** A single fixed contour isolates this fill shader from geometry changes. */
export default class FillCustomfilleffectScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const reference = new Rect(5.5, 0.25, { fill: hex('#334155') });
    const shape = new Rect(3.5, 2.5, { fill: hex('#38bdf8'), stroke: hex('#e2e8f0'), strokeWidth: 0.035 });
    shape.setFillEffect(new CustomFillEffect('return vec4f(col.rgb * (0.5 + 0.5 * sin(localPos.x * 5.0)), col.a);'));
    this.add(reference, shape);
    await this.play(new FadeIn(shape), { duration: 900 });
    await this.wait(2500);
  }
}
