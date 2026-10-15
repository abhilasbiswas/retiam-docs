import { Scene, CameraModel, Circle, hex } from 'retiam';

/** Scene time slows and resumes while one dot follows the same circular motion. */
export default class TimeScaleExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const dot = new Circle(0.28, { fill: hex('#38bdf8') });
    this.add(dot);
    this.always((time) => dot.move([2.2 * Math.cos(time / 500), 2.2 * Math.sin(time / 500), 0]));
    await this.animateTimeScale(0.2, 700);
    await this.wait(500);
    await this.animateTimeScale(1, 700);
    await this.wait(1800);
  }
}
