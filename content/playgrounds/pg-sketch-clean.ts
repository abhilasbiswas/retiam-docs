import { CameraModel, Create, Rect, Scene, hex } from 'retiam';

/** One rectangle shows the selected hand-drawn preset using a reproducible seed. */
export default class SketchCleanScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(3.5, 2.2);
    shape.toExcalidraw({ preset: 'clean', seed: 7, stroke: '#38bdf8', strokeWidth: 0.04, fill: '#38bdf833', fillStyle: 'hachure' });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1500 });
    await this.wait(1800);
  }
}
