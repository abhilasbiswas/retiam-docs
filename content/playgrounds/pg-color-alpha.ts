import { CENTER, CameraModel, Circle, Color, Rect, SDFText, Scene, hex } from 'retiam';

/** Identical circles compare opaque fill, translucent fill, and no fill over one reference stripe. */
export default class ColorAlphaScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const stripe = new Rect(8.2, 0.35, { fill: hex('#f59e0b'), stroke: Color.NONE });
    this.add(stripe);
    for (const [x, alpha, text] of [[-2.6, 1, 'Opaque'], [0, 0.35, 'Alpha 0.35'], [2.6, 0, 'No fill']] as const) {
      const shape = new Circle(0.9, { fill: alpha ? hex('#38bdf8', alpha) : Color.NONE, stroke: hex('#e2e8f0'), strokeWidth: 0.045 }).move([x, 0, 0]);
      const label = new SDFText(text, { fontSize: 0.3, anchor: CENTER, fill: hex('#e2e8f0') }).move([x, -1.5, 0]);
      this.add(shape, label);
    }
    await this.wait(3000);
  }
}
