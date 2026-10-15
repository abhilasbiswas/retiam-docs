import { Scene, Rect, Circle, Line, Color, CameraModel, hex } from 'retiam';

/** Compare an anchor attached to a shape with a pivot fixed in the world. */
export default class TransformLab extends Scene {
  private shape?: Rect;
  private marker?: Circle;
  private values = { angle: 25, scale: 1, anchor: 'center', mode: 'local anchor', pivotX: 0 };

  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 12;
    const axes = new Line([[-5, 0], [5, 0]], { stroke: hex('#334155'), strokeWidth: 0.025 });
    const vertical = new Line([[0, -3], [0, 3]], { stroke: hex('#334155'), strokeWidth: 0.025 });
    this.marker = new Circle(0.12, { fill: hex('#f59e0b'), stroke: Color.NONE });
    this.add(axes, vertical, this.marker);
    this.rebuild();
  }

  setParameter(name: string, value: number | string) {
    if (name in this.values) Object.assign(this.values, { [name]: value });
    if (this.marker) this.rebuild();
  }

  private rebuild() {
    if (this.shape) this.remove(this.shape);
    this.shape = new Rect(3, 1.7, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.06 });
    this.shape.move([1.5, 0, 0]);
    this.add(this.shape);
    const anchors: Record<string, [number, number, number]> = { center: [0, 0, 0], left: [-1, 0, 0], right: [1, 0, 0], top: [0, 1, 0] };
    const anchor = anchors[this.values.anchor];
    const pivot = this.values.mode === 'world pivot' ? [this.values.pivotX, 0, 0] as [number, number, number] : this.shape.getBoundaryPoint(anchor);
    this.marker!.move(pivot);
    this.shape.setPivot(pivot);
    this.shape.rotate(this.values.angle * Math.PI / 180);
    this.shape.scale(this.values.scale);
    this.invalidate();
  }
}
