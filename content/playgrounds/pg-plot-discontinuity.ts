import { Axes, CameraModel, Create, FunctionGraph2D, Scene, hex } from 'retiam';

/** Two explicit domains keep a reciprocal graph from bridging its asymptote. */
export default class PlotDiscontinuityScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], width: 7, height: 4, showLabels: false, axisColor: hex('#64748b') });
    const left = new FunctionGraph2D(axes, x => 1 / x, { xRange: [-3, -0.35], primitive: 'path', stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    const right = new FunctionGraph2D(axes, x => 1 / x, { xRange: [0.35, 3], primitive: 'path', stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    this.add(axes, left, right);
    await this.play(new Create(left), new Create(right), { duration: 1600 });
    await this.wait(1700);
  }
}
