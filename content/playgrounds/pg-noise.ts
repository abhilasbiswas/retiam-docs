import { Scene, CameraModel, Axes, FunctionGraph2D, PerlinNoise, hex } from 'retiam';

/** One Perlin source sampled as a one-dimensional function. */
export default class NoiseExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 10;

    const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-1.5, 1.5, 0.5], width: 9, height: 4.5, showGrid: true, showLabels: false });
    const noise = new PerlinNoise({ seed: 7, scale: 1.2 });
    const curve = new FunctionGraph2D(axes, x => noise.evaluate1D(x), { stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(axes, curve);
    this.camera.frame([axes, curve], { padding: 0.28 });
    await this.wait(2600);
  }
}
