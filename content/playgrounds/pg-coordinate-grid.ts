import { Arrow, CENTER, CameraModel, Create, Dot, FadeIn, Line, SDFText, Scene, hex } from 'retiam';

/** A point at (2, 1) is located using the same scene-unit grid as the shapes. */
export default class CoordinateGridScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    for (let x = -4; x <= 4; x++) this.add(new Line([[x, -2], [x, 2]], { stroke: hex('#1e293b'), strokeWidth: 0.018 }));
    for (let y = -2; y <= 2; y++) this.add(new Line([[-4, y], [4, y]], { stroke: hex('#1e293b'), strokeWidth: 0.018 }));
    const xAxis = new Arrow([-4, 0, 0], [4, 0, 0], { stroke: hex('#64748b'), strokeWidth: 0.035 });
    const yAxis = new Arrow([0, -2, 0], [0, 2, 0], { stroke: hex('#64748b'), strokeWidth: 0.035 });
    const point = new Dot([2, 1, 0], { radius: 0.1, fill: hex('#38bdf8') });
    const label = new SDFText('(2, 1)', { fontSize: 0.35, anchor: CENTER, fill: hex('#38bdf8') }).move([2, 1.5, 0]);
    this.add(xAxis, yAxis, point, label);
    await this.play(new Create(xAxis), new Create(yAxis), new FadeIn(point), new FadeIn(label), { duration: 1000 });
    await this.wait(2000);
  }
}
