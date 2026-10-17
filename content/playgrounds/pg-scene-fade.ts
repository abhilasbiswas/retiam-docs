import { CameraModel, Circle, Rect, Scene, hex } from 'retiam';

/** A scene-level fade changes both objects together without editing their individual colors. */
export default class SceneFadeScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const circle = new Circle(0.7, { fill: hex('#38bdf8') }).move([-1.7, 0, 0]);
    const square = new Rect(1.4, 1.4, { fill: hex('#f59e0b') }).move([1.7, 0, 0]);
    this.add(circle, square);
    await this.wait(700);
    await this.play(this.fadeTo(0.15, 1200));
    await this.wait(700);
    await this.play(this.fadeTo(1, 1200));
    await this.wait(1200);
  }
}
