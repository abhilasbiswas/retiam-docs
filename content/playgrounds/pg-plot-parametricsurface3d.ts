import { CameraModel, ParametricSurface3D, Scene, Vec3, hex } from 'retiam';

/** A small sampled parametric function becomes visible spatial geometry. */
export default class PlotParametricsurface3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const graph = new ParametricSurface3D((u, v) => new Vec3(u, 0.4 * Math.sin(u * 2) * Math.cos(v * 2), v), { uRange: [-2, 2], vRange: [-2, 2], uSegments: 24, vSegments: 24 });
    this.add(graph);
    this.camera.frame(graph, { padding: 0.45 });
    await this.wait(3300);
  }
}
