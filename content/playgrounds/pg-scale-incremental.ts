import { CameraModel, Poly, Scene, Vec2, hex } from 'retiam';

/** Repeated scale(1.5) multiplies the current size each time. */
export default class ScaleIncrementalScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Poly([new Vec2(-0.8, -0.65), new Vec2(0.8, -0.65), new Vec2(0.2, 0.9)], { fill: hex('#38bdf8'), stroke: hex('#e2e8f0'), strokeWidth: 0.035 });
    this.add(shape);
    for (let step = 0; step < 3; step++) {
      await this.wait(850);
      shape.scale(1.5); this.invalidate();
    }
    await this.wait(1400);
  }
}
