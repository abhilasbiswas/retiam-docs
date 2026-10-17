import { CameraModel, Color, Create, Dot, NONE, Path, ResampleModifier, Scene, hex } from 'retiam';

/** A muted source contour stays fixed while the modified contour shows the result. */
export default class ModifierResamplemodifierScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = 'M -3 -1 L -1 1 L 1 -0.5 L 3 1';
    const original = new Path(source, { fill: Color.NONE, stroke: hex('#475569'), strokeWidth: 0.025 });
    const shape = new Path(source, { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.065 });
    shape.addModifier(new ResampleModifier({ count: 12 }));
    this.add(original, shape);

    for (const contour of shape.getEvaluatedContours()) {
      for (let i = 0; i < contour.length; i += 2) {
        this.add(new Dot([contour[i], contour[i + 1], 0], { radius: 0.035, fill: hex('#f59e0b') }));
      }
    }

    await this.play(new Create(shape), { duration: 1800 });
    await this.wait(1700);
  }
}
