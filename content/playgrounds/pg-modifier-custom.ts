import { CameraModel, Color, Create, CustomModifier, NONE, Path, Scene, hex } from 'retiam';

/** The custom modifier copies each contour before shifting its coordinates. */
export default class ModifierCustomScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = 'M -3 0 Q 0 2 3 0';
    const original = new Path(source, { fill: Color.NONE, stroke: hex('#475569'), strokeWidth: 0.03 });
    const shape = new Path(source, { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.06 });
    shape.addModifier(new CustomModifier(contours => contours.map(contour => {
      const copy = contour.slice();
      for (let i = 1; i < copy.length; i += 2) copy[i] += 0.7;
      return copy;
    }), 'lift'));
    this.add(original, shape);
    await this.play(new Create(shape), { duration: 1600 });
    await this.wait(1600);
  }
}
