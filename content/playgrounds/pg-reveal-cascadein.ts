import { CameraModel, CascadeIn, Entity, Rect, Scene, hex } from 'retiam';

/** Three identical parts make the child timing and movement visible. */
export default class RevealCascadeinScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const group = new Entity();
    for (let i = 0; i < 3; i++) {
      const part = new Rect(0.9, 0.9, { fill: hex(i === 1 ? '#f59e0b' : '#38bdf8') }).move([(i - 1) * 1.6, 0, 0]);
      group.add(part);
    }
    this.add(group);
    await this.play(new CascadeIn(group, { lagRatio: 0.2 }), { duration: 1900 });
    await this.wait(1500);
  }
}
