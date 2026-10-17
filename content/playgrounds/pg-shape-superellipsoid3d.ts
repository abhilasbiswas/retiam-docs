import { CameraModel, Scene, hex } from 'retiam';
import { Superellipsoid3D } from 'retiam/shapes';

/** One mesh and a slow inspection turn make the procedural geometry easy to read. */
export default class ShapeSuperellipsoid3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const shape = new Superellipsoid3D({ radiusX: 1.3, radiusY: 1.1, radiusZ: 1, e1: 0.5, e2: 0.5 });
    shape.setColor(hex('#38bdf8')).setRoughness(0.4);
    this.add(shape);
    this.camera.frame(shape, { padding: 0.45 });
    await this.play(shape.animate.rotateY(Math.PI / 3), { duration: 2400 });
    await this.wait(1500);
  }
}
