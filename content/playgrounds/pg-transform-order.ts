import { CameraModel, Dot, Rect, Scene, hex } from 'retiam';

/** The same move and rotate operations produce different positions when their order changes. */
export default class TransformOrderScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const first = new Rect(1.6, 0.6, { fill: hex('#38bdf8') });
    const second = new Rect(1.6, 0.6, { fill: hex('#f59e0b') });
    this.add(first, second);
    first.shift([2, 0, 0]); first.rotateWorld(Math.PI / 2, [0, 0, 0]);
    second.rotateWorld(Math.PI / 2, [0, 0, 0]); second.shiftWorld([2, 0, 0]);
    this.add(new Dot([0, 0, 0], { radius: 0.08, fill: hex('#e2e8f0') }));
    await this.wait(3500);
  }
}
