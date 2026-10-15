import { Scene, Axes, FunctionGraph2D, CameraModel, hex } from 'retiam';

export default class TangentProject extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 9; this.camera.position.set([0, 0, 20]);
    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-1, 5, 1], width: 8, height: 6, showGrid: true, gridColor: hex('#334155', 0.4), axisColor: hex('#64748b') });
    const f = (x: number) => x * x / 2;
    const curve = new FunctionGraph2D(axes, f, { stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(axes, curve);
  }
}
