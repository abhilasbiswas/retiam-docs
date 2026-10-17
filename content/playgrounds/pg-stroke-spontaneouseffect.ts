import { CameraModel, Color, Create, NONE, Path, Scene, SpontaneousEffect, hex } from 'retiam';

/** The same reference curve makes the stroke treatment directly comparable. */
export default class StrokeSpontaneouseffectScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const path = new Path('M -3 -1 Q -1 2 1 0 Q 2 -1.5 3 1', { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.16 });
    path.setPathEffect(new SpontaneousEffect());
    this.add(path);
    await this.play(new Create(path), { duration: 2000 });
    await this.wait(1600);
  }
}
