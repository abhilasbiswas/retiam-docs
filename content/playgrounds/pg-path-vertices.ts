import { CameraModel, Color, Path, Scene, hex } from 'retiam';

/** A muted outline preserves the original contour while setVertices changes the displayed geometry. */
export default class PathVerticesScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const initial = [[-2, -1], [0, 1], [2, -1]];
    const original = new Path(initial, { fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.035 });
    const path = new Path(initial, { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(original, path);
    await this.wait(900);
    path.setVertices([[-2, 1], [0, -1], [2, 1]], false); this.invalidate();
    await this.wait(2200);
  }
}
