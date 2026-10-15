import { Scene, CameraModel, Sphere, hex } from 'retiam';

/** One material defines the color, metallic response and roughness of one sphere. */
export default class MaterialExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([0, 0, 7]);

    const sphere = new Sphere(1.6, { widthSegments: 48, heightSegments: 48 });
    sphere.material.color = hex('#38bdf8');
    sphere.material.metallic = 0.85;
    sphere.material.roughness = 0.18;
    this.add(sphere);
    this.camera.frame(sphere, { padding: 0.28 });
    await this.wait(3600);
  }
}
