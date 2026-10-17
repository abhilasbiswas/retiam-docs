import { CameraModel, Scene, Torus, hex } from 'retiam';

/** A single mesh turns slightly so its three-dimensional structure is visible. */
export default class PrimitiveTorusScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const shape = new Torus(1.2, 0.35);
    shape.setColor(hex('#38bdf8')).setRoughness(0.45);
    this.add(shape);
    this.camera.frame(shape, { padding: 0.45 });
    await this.play(shape.animate.rotateY(Math.PI / 3), { duration: 2300 });
    await this.wait(1600);
  }
}
