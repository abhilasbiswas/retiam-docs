import { Scene, Sphere, OrbitCameraController, Vec3, hex } from 'retiam';

/** One OrbitCameraController orbits one camera around one sphere. */
export default class OrbitControllerExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.position.set([4, 3, 7]);
    this.camera.lookAt([0, 0, 0]);
    const sphere = new Sphere(1.25, { widthSegments: 32, heightSegments: 24 });
    sphere.material.color = hex('#38bdf8');
    this.add(sphere);
    new OrbitCameraController(this, this.camera, {
      radius: 8.6,
      targetCenter: new Vec3(0, 0, 0),
    });
    await this.wait(2600);
  }
}
