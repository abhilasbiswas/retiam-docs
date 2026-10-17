import { CameraModel, Circle, Scene, hex } from 'retiam';

/** Six short moves and color changes run through awaited completion boundaries in order. */
export default class BoundarySequenceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.32, {fill: hex('#38bdf8')}).move([-2.5, 0, 0]);
    this.add(dot);
    await this.wait(600);
    for (let i = 1; i <= 6; i++) {
      await this.play(dot.animate.move([-2.5 + i * 0.8, 0, 0]).setFill(hex(i % 2 ? '#f59e0b' : '#38bdf8')), {duration: 180});
    }
    await this.wait(1600);
  }
}
