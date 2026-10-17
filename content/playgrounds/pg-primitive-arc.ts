import { Arc, CameraModel, Color, Create, NONE, Scene, hex } from 'retiam';

/** An arc shows a selected sweep of an ellipse. */
export default class PrimitiveArcScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Arc(3, 3, 0, Math.PI * 1.5, { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
