import { Axes, CameraModel, Create, ImplicitCurve2DGPU, Scene, hex } from 'retiam';

/** One coordinate map and one function define the entire plot. */
export default class PlotImplicitcurve2dgpuScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], width: 7, height: 4, showLabels: false, axisColor: hex('#64748b') });
    const graph = new ImplicitCurve2DGPU(axes, 'return x*x + y*y - 2.25;', { stroke: hex('#38bdf8'), strokeWidth: 0.06 });
    this.add(axes, graph);
    await this.play(new Create(graph), { duration: 1800 });
    await this.wait(1700);
  }
}
