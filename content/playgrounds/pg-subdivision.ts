import { Scene, CameraModel, Line, Dot, Vec3, Color, SubdivisionEngine, hex } from 'retiam';

/** Subdivide one polyline and expose the generated sample points. */
export default class SubdivisionExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 9;

    const control = [new Vec3(-4, -1, 0), new Vec3(-1, 2, 0), new Vec3(4, -1, 0)];
    const samples = SubdivisionEngine.subdividePolyline(control, { maxSegmentLength: 0.55 });
    const path = new Line(samples, { stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    const dots = samples.map(point => new Dot(point, { radius: 0.075, fill: hex('#f59e0b'), stroke: Color.NONE }));
    this.add(path, ...dots);
    this.camera.frame([path, ...dots], { padding: 0.3 });
    await this.wait(2200);
  }
}
