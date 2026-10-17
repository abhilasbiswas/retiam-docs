import { CameraModel, Scene, Sphere, hex } from 'retiam';
import { ShadingStyle } from 'retiam';

/** One sphere uses the PBR surface shading style. */
export default class ShadingPbrScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.renderConfig.shadingStyle = ShadingStyle.PBR;
    const sphere = new Sphere(1.5); sphere.material.color = hex('#38bdf8');
    this.add(sphere); this.camera.frame(sphere, {padding: 0.35});
    await this.wait(3200);
  }
}
