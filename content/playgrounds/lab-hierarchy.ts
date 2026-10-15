import { Scene, VGroup, Rect, Circle, CameraModel, hex } from 'retiam';

/** Rotate a parent, then translate its child along the parent's local axes. */
export default class HierarchyLab extends Scene {
  private group?: VGroup;
  private child?: Circle;
  private values = { angle: 20, childX: 2, scale: 1 };
  async run() {
    this.clearColor(hex('#080c14')); this.camera.model = CameraModel.ORTHOGRAPHIC; this.camera.orthoScale = 12; this.camera.position.set([0, 0, 20]);
    const body = new Rect(3, 1.5, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.04 });
    this.child = new Circle(0.3, { fill: hex('#f59e0b') });
    this.group = new VGroup(); this.group.add(body, this.child); this.add(this.group); this.updateValues();
  }
  setParameter(name: string, value: number | string) { if (name in this.values) Object.assign(this.values, { [name]: Number(value) }); this.updateValues(); }
  private updateValues() {
    if (!this.group || !this.child) return;
    this.group.setRotation(this.values.angle * Math.PI / 180); this.group.setScale(this.values.scale); this.child.move([this.values.childX, 0, 0]); this.invalidate();
  }
}
