import { CENTER, CameraModel, Color, Component, NONE, Rect, SDFText, Scene, hex } from 'retiam';

/** A rotating component pauses when disabled, resumes, and finally stops when removed. */
export default class ComponentLifetimeScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    class Spin extends Component {
      update(_time: number, dt: number) { this.entity.rotate(dt * 0.001); }
    }
    this.ALWAYS_UPDATE = true;
    const tile = new Rect(2.2, 1, {fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.07});
    const label = new SDFText('Attached', {fontSize: 0.45, anchor: CENTER}).move([0, 1.8, 0]);
    const spin = tile.addComponent(new Spin());
    this.add(tile, label);
    await this.wait(1000); spin.enabled = false; label.setText('Disabled');
    await this.wait(900); spin.enabled = true; label.setText('Enabled');
    await this.wait(1000); tile.removeComponent(spin); label.setText('Removed');
    await this.wait(1200);
  }
}
