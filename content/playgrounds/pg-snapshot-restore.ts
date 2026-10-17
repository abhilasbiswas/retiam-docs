import { CameraModel, Circle, Scene, hex } from 'retiam';

/** A checkpoint restores the same retained entity after its position and color change. */
export default class SnapshotRestoreScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.4,{fill:hex('#38bdf8')}).move([-2.5,0,0]);this.add(dot);await this.wait(700);
    const snapshot=this.snapshotManager.capture(this,'Before movement');
    await this.play(dot.animate.move([2.5,0,0]).setFill(hex('#f59e0b')),{duration:1800});await this.wait(700);
    this.snapshotManager.restore(this,snapshot);this.invalidate();await this.wait(1200);
  }
}
