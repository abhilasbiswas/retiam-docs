import { Axes, CameraModel, Create, FunctionGraph2D, Scene, hex } from 'retiam';

/** Finite-width rectangles approximate the area over one interval. */
export default class CalculusRiemannScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], width: 7, height: 4, showLabels: false, axisColor: hex('#64748b') });
    const graph = new FunctionGraph2D(axes, x => 0.4 * x * x, { primitive: 'path', stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    const annotation = axes.getRiemannRectangles(graph, [0, 2], 0.3, { fill: hex('#38bdf8', 0.35), stroke: hex('#f59e0b'), strokeWidth: 0.02 });
    this.add(axes, graph, annotation);
    await this.play(new Create(graph), { duration: 1400 });
    await this.wait(2000);
  }
}
