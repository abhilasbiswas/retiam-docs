import { CameraModel, Scene, SurfaceGraph3D, ThreeDAxes, hex } from 'retiam';

/** A two-variable height function shares one three-dimensional coordinate map. */
export default class PlotSurfaceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const axes = new ThreeDAxes({ xRange: [-2, 2, 1], yRange: [-2, 2, 1], zRange: [-2, 2, 1], width: 4, height: 4, depth: 4, showLabels: false });
    const graph = new SurfaceGraph3D(axes, (x, y) => 0.5 * Math.sin(x * 2) * Math.cos(y * 2));
    this.add(axes, graph);
    this.camera.frame([axes, graph], { padding: 0.4 });
    await this.wait(3300);
  }
}
