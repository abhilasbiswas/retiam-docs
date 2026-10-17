import { CameraModel, Circle, Rect, Scene, VBox, hex } from 'retiam';

/** Adding and removing a child makes the container calculate a fresh layout. */
export default class VboxContainerScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const a = new Circle(0.45, { fill: hex('#38bdf8') });
    const b = new Rect(1.2, 0.7, { fill: hex('#f59e0b') });
    const layout = new VBox({ gap: 0.6 }); layout.add(a, b);
    this.add(layout);
    await this.wait(900);
    const c = new Circle(0.3, { fill: hex('#e2e8f0') });
    layout.add(c); this.invalidate();
    await this.wait(1200);
    layout.remove(a); a.destroy(); this.invalidate();
    await this.wait(1600);
  }
}
