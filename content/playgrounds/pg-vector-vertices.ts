import { CENTER, CameraModel, Dot, Poly, SDFText, Scene, Vec2, hex } from 'retiam';

/** Numbered markers reveal the local vertices returned by the vector entity. */
export default class VectorVerticesScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const poly = new Poly([new Vec2(-1.6, -1), new Vec2(1.6, -1), new Vec2(0.4, 1.2)], { fill: hex('#38bdf8', 0.12), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(poly);
    poly.getVertices().forEach((point, index) => {
      const marker = new Dot([point.x, point.y, 0], { radius: 0.09, fill: hex('#f59e0b') });
      const label = new SDFText(String(index), { fontSize: 0.3, anchor: CENTER, fill: hex('#e2e8f0') }).move([point.x, point.y + 0.4, 0]);
      this.add(marker, label);
    });
    await this.wait(3300);
  }
}
