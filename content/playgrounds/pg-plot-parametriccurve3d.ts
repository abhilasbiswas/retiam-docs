import { CameraModel, ParametricCurve3D, Scene, Vec3, hex } from 'retiam';

/** A small sampled parametric function becomes visible spatial geometry. */
export default class PlotParametriccurve3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const graph = new ParametricCurve3D(t => new Vec3(Math.cos(t), Math.sin(t), t / Math.PI - 1.5), { tRange: [0, Math.PI * 3], samples: 120, stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(graph);
    this.camera.frame(graph, { padding: 0.45 });
    await this.wait(3300);
  }
}
