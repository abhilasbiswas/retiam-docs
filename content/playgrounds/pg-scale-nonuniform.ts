import { CameraModel, Color, Rect, Scene, hex } from 'retiam';

/** A square becomes a wide rectangle when only its local x scale changes. */
export default class ScaleNonuniformScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(1.5, 1.5, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    const reference = new Rect(1.5, 1.5, { fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.025 });
    this.add(reference, shape);
    await this.play(shape.animate.setScale([2.5, 1, 1]), { duration: 1800 });
    await this.wait(1500);
  }
}
