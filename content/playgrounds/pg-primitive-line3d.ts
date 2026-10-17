import { CameraModel, Create, Line3D, Scene, hex } from 'retiam';

/** A short path in three dimensions stays visible as the observer sees its depth. */
export default class PrimitiveLine3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const path = new Line3D([[-2, -1, 0], [0, 1, 1.5], [2, -0.5, -1]], { stroke: hex('#38bdf8'), strokeWidth: 0.08 });
    this.add(path);
    await this.play(new Create(path), { duration: 1800 });
    await this.wait(1600);
  }
}
