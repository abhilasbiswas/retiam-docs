import { CameraModel, Circle, Rect, Scene, SubScene, hex } from 'retiam';

/** A nested scene draws two marks; its SubScene wrapper moves and rotates both as one entity. */
export default class SubsceneScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    class Pair extends Scene {
      async run() {
        const a = new Circle(0.45, { fill: hex('#38bdf8') }).move([-0.8, 0, 0]);
        const b = new Rect(0.7, 0.7, { fill: hex('#f59e0b') }).move([0.8, 0, 0]);
        this.add(a, b);
        await this.play(a.animate.shift([0, 0.6, 0]), {duration: 900});
      }
    }
    const nested = new SubScene(new Pair());
    this.add(nested);
    await this.wait(1200);
    await this.play(nested.animate.rotate(Math.PI / 4).shift([1.5, 0, 0]), {duration: 1400});
    await this.wait(1200);
  }
}
