import { Box, CameraModel, Line3D, Quaternion, Scene, Vec3, hex } from 'retiam';

/** An axis-angle quaternion rotates one asymmetric box around its vertical axis. */
export default class QuaternionRotationScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const shape = new Box(2.5, 1.3, 0.8).setColor(hex('#38bdf8'));
    const axis = new Line3D([[0, -2, 0], [0, 2, 0]], { stroke: hex('#f59e0b'), strokeWidth: 0.04 });
    this.add(shape, axis);
    const rotation = Quaternion.fromAxisAngle(new Vec3(0, 1, 0), Math.PI / 2);
    await this.play(shape.animate.setRotation(rotation), { duration: 2100 });
    await this.wait(1500);
  }
}
