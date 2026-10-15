import { Scene, Bezier, Circle, Line, CameraModel, InteractionManager, InteractionComponent, Vec3, Color, hex } from 'retiam';

/** Drag any dot. The control polygon and the curve use the same four points. */
export default class BezierLab extends Scene {
  private curve?: Bezier;
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC; this.camera.orthoScale = 12; this.camera.position.set([0, 0, 20]);
    new InteractionManager(this);
    const points: [number, number][] = [[-4, -1], [-2, 2], [2, -2], [4, 1]];
    const cage = new Line(points, { stroke: hex('#334155'), strokeWidth: 0.035 });
    this.curve = new Bezier(points, { stroke: hex('#38bdf8'), strokeWidth: 0.07, fill: Color.NONE, segments: 64 });
    this.add(cage, this.curve);
    points.forEach((point, index) => {
      const handle = new Circle(0.18, { fill: hex('#f59e0b') }); handle.move([point[0], point[1], 0.1]); this.add(handle);
      const interaction = handle.addComponent(new InteractionComponent()); interaction.isDraggable = true;
      interaction.onDrag = (position: Vec3) => { points[index] = [position.x, position.y]; handle.move([position.x, position.y, 0.1]); cage.setVertices(points); this.curve!.setPoints(points); this.invalidate(); };
    });
  }
  setParameter(name: string, value: number | string) {
    if (name === 'strokeWidth') this.curve?.setStrokeWidth(Number(value)); this.invalidate();
  }
}
