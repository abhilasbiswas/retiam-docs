import { CameraModel, Scene, Sphere, ThreeDAxes, hex } from 'retiam';

/** Three perpendicular axes locate one point in space. */
export default class CoordinatesThreeDScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const axes = new ThreeDAxes({ xRange: [-2, 2, 1], yRange: [-2, 2, 1], zRange: [-2, 2, 1], width: 4, height: 4, depth: 4, showLabels: false });
    const marker = new Sphere(0.12).move(axes.c2p(1, 1, 1)).setColor(hex('#f59e0b'));
    this.add(axes, marker);
    this.camera.frame([axes, marker], { padding: 0.35 });
    await this.wait(3000);
  }
}
