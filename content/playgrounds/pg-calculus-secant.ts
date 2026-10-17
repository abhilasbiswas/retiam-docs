import { Axes, CameraModel, Create, FunctionGraph2D, Scene, hex } from 'retiam';

/** A secant connects two samples of the same function. */
export default class CalculusSecantScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], width: 7, height: 4, showLabels: false, axisColor: hex('#64748b') });
    const graph = new FunctionGraph2D(axes, x => 0.4 * x * x, { primitive: 'path', stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    const annotation = axes.getSecantSlopeGroup(-0.8, 1.5, graph, { stroke: hex('#f59e0b'), strokeWidth: 0.05 });
    this.add(axes, graph, annotation);
    await this.play(new Create(graph), { duration: 1400 });
    await this.wait(2000);
  }
}
