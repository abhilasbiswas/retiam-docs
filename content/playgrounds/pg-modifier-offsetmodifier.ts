import { CameraModel, Color, Create, NONE, OffsetModifier, Path, Scene, hex } from 'retiam';

/** A muted source contour stays fixed while the modified contour shows the result. */
export default class ModifierOffsetmodifierScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = 'M -2 -1 L -2 1 L 2 1 L 2 -1 Z';
    const original = new Path(source, { fill: Color.NONE, stroke: hex('#475569'), strokeWidth: 0.025 });
    const shape = new Path(source, { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.065 });
    shape.addModifier(new OffsetModifier({ distance: 0.4 }));
    this.add(original, shape);

    await this.play(new Create(shape), { duration: 1800 });
    await this.wait(1700);
  }
}
