import { CameraModel, Dot, LEFT, Rect, Scene, hex } from 'retiam';

/** A rectangle keeps its placement when its pivot is set, then rotates around the marked left edge. */
export default class TransformPivotScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(3, 1.1, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    const pivot = shape.getBoundaryPoint(LEFT);
    const marker = new Dot(pivot, { radius: 0.1, fill: hex('#f59e0b') });
    this.add(shape, marker);
    await this.wait(800);
    shape.setPivot(pivot); this.invalidate();
    await this.wait(800);
    await this.play(shape.animate.rotate(Math.PI / 2), { duration: 1700 });
    await this.wait(1400);
  }
}
