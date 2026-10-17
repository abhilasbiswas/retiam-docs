import { CameraModel, Create, Dot, Scene, hex } from 'retiam';

/** A dot marks a single coordinate. */
export default class PrimitiveDotScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Dot([0, 0, 0], { radius: 0.22, fill: hex('#38bdf8') });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });
    await this.wait(700);
    shape.setRadius(0.45); this.invalidate();
    await this.wait(1800);
  }
}
