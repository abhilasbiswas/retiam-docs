import { Scene, CameraModel, Axes, FunctionGraph2D, hex } from 'retiam';

/** One FunctionGraph2D samples one function on one coordinate system. */
export default class FunctionGraphExample extends Scene {
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
    this.add(axes, curve);
    await this.wait(2600);
  }
}
