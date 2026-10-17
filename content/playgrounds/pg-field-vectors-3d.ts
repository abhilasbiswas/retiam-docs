import { CameraModel, Scene, Vec3, VectorField3D, hex } from 'retiam';

/** A sparse spatial field makes each sample direction visible. */
export default class FieldVectors3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const field = new VectorField3D(p => new Vec3(-p.y, p.x, 0.3), { xRange: [-2, 2, 1], yRange: [-2, 2, 1], zRange: [-1, 1, 1], arrowScale: 0.4, normalize: true });
    this.add(field);
    await this.wait(3300);
  }
}
