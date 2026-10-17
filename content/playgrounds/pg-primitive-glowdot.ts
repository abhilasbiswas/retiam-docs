import { CameraModel, Create, GlowDot, Scene, hex } from 'retiam';

/** A glow makes one marked coordinate stand out. */
export default class PrimitiveGlowdotScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new GlowDot([0, 0, 0], { radius: 0.25, fill: hex('#38bdf8') });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
