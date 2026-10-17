import { CameraModel, Color, Create, NONE, Path, Scene, WobbleModifier, hex } from 'retiam';

/** A muted source contour stays fixed while the modified contour shows the result. */
export default class ModifierWobblemodifierScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = 'M -3 -1 L -1 1 L 1 -0.5 L 3 1';
    const original = new Path(source, { fill: Color.NONE, stroke: hex('#475569'), strokeWidth: 0.025 });
    const shape = new Path(source, { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.065 });
    shape.addModifier(new WobbleModifier({ roughness: 0.18, bowing: 0.1, seed: 7 }));
    this.add(original, shape);

    await this.play(new Create(shape), { duration: 1800 });
    await this.wait(1700);
  }
}
