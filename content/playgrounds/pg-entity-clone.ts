import { CameraModel, Rect, Scene, hex } from 'retiam';

/** Two clones share the same shape while color and transform changes remain independent. */
export default class EntityCloneScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const original = new Rect(1.8, 1.4, { fill: hex('#38bdf8') }).move([-2, 0, 0]);
    const copy = original.clone().move([2, 0, 0]);
    this.add(original, copy);
    await this.wait(700);
    await this.play(copy.animate.setFill(hex('#f59e0b')).rotate(Math.PI / 4), { duration: 1600 });
    await this.wait(1600);
  }
}
