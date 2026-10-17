import { CameraModel, Circle, Scene, Vec2, hex } from 'retiam';

/** Paint.setClip keeps only the part of a shape inside a rectangular coordinate region. */
export default class PaintClipScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Circle(1.6, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.06 });
    this.add(shape);
    await this.wait(900);
    shape.paint.setClip(new Vec2(0, -2), new Vec2(2, 2)); this.invalidate();
    await this.wait(2000);
  }
}
