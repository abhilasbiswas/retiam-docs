import { Scene, Circle, Rect, CameraModel, hex } from 'retiam';

/** One moving foreground style makes alpha and stroke width easy to compare. */
export default class PaintLab extends Scene {
  private circle?: Circle;
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC; this.camera.orthoScale = 10; this.camera.position.set([0, 0, 20]);
    const backdrop = new Rect(3.8, 2.2, { fill: hex('#f59e0b'), strokeWidth: 0 });
    backdrop.move([0.7, 0, 0]);
    this.circle = new Circle(1.5, { fill: hex('#38bdf8'), stroke: hex('#dce8f8'), strokeWidth: 0.08 });
    this.circle.move([-0.7, 0, 0.1]); this.add(backdrop, this.circle);
  }
  setParameter(name: string, value: number | string) {
    if (!this.circle) return;
    if (name === 'opacity') this.circle.setOpacity(Number(value));
    if (name === 'strokeWidth') this.circle.setStrokeWidth(Number(value));
    if (name === 'radius') this.circle.scale(Number(value) / this.circle.getScaleX());
    this.invalidate();
  }
}
