import { Axes, CameraModel, Create, FunctionGraph2D, Scene, SimplexNoise, hex } from 'retiam';

/** A seeded generator is sampled on the same fixed one-dimensional domain. */
export default class NoiseSimplexnoiseScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new Axes({ xRange: [0, 6, 1], yRange: [-1.5, 1.5, 0.5], width: 7, height: 3.5, showLabels: false });
    const noise = new SimplexNoise({ seed: 7 });
    const graph = new FunctionGraph2D(axes, x => noise.sample1D(x), { samples: 120, primitive: 'path', stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    this.add(axes, graph);
    await this.play(new Create(graph), { duration: 1800 });
    await this.wait(1600);
  }
}
