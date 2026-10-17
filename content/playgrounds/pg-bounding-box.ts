import { CameraModel, Color, NONE, Rect, Scene, hex } from 'retiam';

/** A world-aligned bounding rectangle encloses the same rotated geometry. */
export default class BoundingBoxScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(3, 1.2, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 }).rotate(Math.PI / 5);
    this.add(shape);
    const bounds = shape.getBoundingBox();
    const frame = new Rect(bounds.size.x, bounds.size.y, { fill: Color.NONE, stroke: hex('#f59e0b'), strokeWidth: 0.025 }).move(bounds.center);
    this.add(frame);
    await this.wait(3300);
  }
}
