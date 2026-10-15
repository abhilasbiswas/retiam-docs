import { Scene, Model, Math3D, CameraModel, light, hex } from 'retiam';

/** One metallic sphere accumulates samples in the path-traced pipeline. */
export default class PathTracingExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.renderConfig.raytraceEnabled = true;
    this.renderConfig.rtSamples = 2;
    this.renderConfig.rtMaxAccumulation = 32;
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([4, 2.5, 7]);

    const mesh = Math3D.createSphere(1.4, 40, 40);
    const sphere = new Model(Math3D.computeSmoothShading(mesh.vertices, mesh.indices!));
    sphere.material.color = hex('#e2e8f0').rgba;
    sphere.material.metallic = 0.9;
    sphere.material.roughness = 0.12;
    this.add(sphere);
    light.position.set([3, 5, 4]);
    this.camera.lookAt(sphere);
    this.camera.frame(sphere, { padding: 0.3 });
    await this.wait(2800);
  }
}
