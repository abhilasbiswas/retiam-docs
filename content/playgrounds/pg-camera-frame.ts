import { Scene, CameraModel, Rect, hex } from 'retiam';

/** Camera.frame centers and fits one off-center subject with explicit padding. */
export default class CameraFrameExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);

    const subject = new Rect(4, 2, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    subject.move([4, 2, 0]);
    this.add(subject);
    this.camera.frame(subject, { padding: 0.25 });
    await this.wait(3600);
  }
}
