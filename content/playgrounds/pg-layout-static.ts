import { CameraModel, Circle, Entity, HBox, Rect, Scene, hex } from 'retiam';

/** Static arrangement positions independent objects; moving one does not move the others. */
export default class LayoutStaticScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const a = new Circle(0.45, { fill: hex('#38bdf8') });
    const b = new Rect(1.2, 0.7, { fill: hex('#f59e0b') });
    HBox.arrange<Entity>({ gap: 0.7 }, a, b);
    this.add(a, b);
    await this.wait(900);
    await this.play(a.animate.shift([0, 1.4, 0]), { duration: 1400 });
    await this.wait(1500);
  }
}
