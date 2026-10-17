import { CENTER, CameraModel, Circle, SDFText, Scene, hex } from 'retiam';

/** One updater moves a dot, pauses in place, resumes, then unregisters. */
export default class UpdaterControlsScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.3, {fill: hex('#38bdf8')}).move([-2.5, 0, 0]);
    const status = new SDFText('Running', {fontSize: 0.45, anchor: CENTER}).move([0, 1.5, 0]);
    this.add(dot, status);
    const task = dot.always((_time, dt) => dot.shift([dt * 0.001, 0, 0]));
    await this.wait(1000); task.pause(); status.setText('Paused'); this.invalidate();
    await this.wait(900); task.resume(); status.setText('Resumed');
    await this.wait(1000); task.stop(); status.setText('Stopped'); this.invalidate();
    await this.wait(1200);
  }
}
