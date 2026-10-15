import { Scene, Rect, Circle, CameraModel, hex } from 'retiam';

/** Equal shapes at different depths separate projection from object size. */
export default class CameraLab extends Scene {
  async run() {
    this.clearColor(hex('#080c14')); this.camera.model = CameraModel.ORTHOGRAPHIC; this.camera.orthoScale = 12; this.camera.position.set([0, 0, 20]);
    const front = new Circle(1, { fill: hex('#38bdf8') }); front.move([-2, 0, 4]);
    const back = new Circle(1, { fill: hex('#f59e0b') }); back.move([2, 0, -4]);
    const border = new Rect(10, 5, { fill: hex('#000000', 0), stroke: hex('#334155'), strokeWidth: 0.03 }); this.add(border, front, back);
  }
  setParameter(name: string, value: number | string) {
    if (name === 'projection') this.camera.model = value === 'perspective' ? CameraModel.PERSPECTIVE : CameraModel.ORTHOGRAPHIC;
    if (name === 'distance') this.camera.position.set([0, 0, Number(value)]);
    if (name === 'fov') this.camera.fov = Number(value) * Math.PI / 180;
    if (name === 'orthoScale') this.camera.orthoScale = Number(value);
    this.invalidate();
  }
}
