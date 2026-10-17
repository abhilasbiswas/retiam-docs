import { CameraModel, Create, PolarAxes, PolarCurve, Scene, hex } from 'retiam';

/** A radial function is evaluated on a polar coordinate system. */
export default class PlotPolarScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new PolarAxes({ rMax: 3, radius: 2.5, showLabels: false });
    const graph = new PolarCurve(axes, theta => 1.6 + 0.6 * Math.cos(3 * theta), { stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    this.add(axes, graph);
    await this.play(new Create(graph), { duration: 1900 });
    await this.wait(1600);
  }
}
