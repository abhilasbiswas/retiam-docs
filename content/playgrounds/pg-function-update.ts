import { Scene, CameraModel, Axes, FunctionGraph2D, hex } from 'retiam';

/** FunctionGraph2D.setFunction replaces one sampled function. */
export default class FunctionUpdateExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 8;

    const axes = new Axes({
      xRange: [-3, 3, 1],
      yRange: [-2, 2, 1],
      width: 8,
      height: 5,
      showGrid: true,
      showLabels: false,
    });
    const curve = new FunctionGraph2D(axes, x => Math.sin(x), {
      stroke: hex('#38bdf8'),
      strokeWidth: 0.07,
    });
    curve.setFunction(x => 0.5 * x);
    this.add(axes, curve);
    await this.wait(2600);
  }
}
