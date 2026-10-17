import { Arrange, CameraModel, Circle, Scene, hex } from 'retiam';

/** Six copies of one small circle use a single curve layout. */
export default class ArrangeCurveScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dots = new Arrange(new Circle(0.25, {fill: hex('#38bdf8')}), 6).arrangeAlongCurve(t => [5 * t - 2.5, Math.sin(t * Math.PI * 2), 0]);
    this.add(dots);
    await this.wait(3000);
  }
}
