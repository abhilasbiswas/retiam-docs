import { Scene, Box, Sphere, OrbitCameraController, Vec3, hex } from 'retiam';

export default class ModelProject extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.fov = Math.PI / 3;
    this.camera.position.set([6, 4, 9]); this.camera.lookAt([0, 0, 0]);
    const box = new Box(1.8, 1.8, 1.8); box.move([-1.6, 0, 0]);
    const sphere = new Sphere(1, { widthSegments: 32, heightSegments: 24 }); sphere.move([1.6, 0, 0]);
    box.material.color = hex('#38bdf8'); sphere.material.color = hex('#f59e0b');
    this.add(box, sphere);
    new OrbitCameraController(this, this.camera, { radius: 10, targetCenter: new Vec3(0, 0, 0) });
  }
}
