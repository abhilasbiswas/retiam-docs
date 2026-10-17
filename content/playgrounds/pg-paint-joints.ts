import { CameraModel, Color, JointType, Path, Scene, hex } from 'retiam';

/** Miter, round, and bevel joins connect identical thick polyline segments. */
export default class PaintJointsScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    for (const [x, joint] of [[-2.7, JointType.MITER], [0, JointType.ROUND], [2.7, JointType.BEVEL]] as const) {
      const path = new Path([[-0.8, -0.8], [0, 1], [0.8, -0.8]], { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.3 });
      path.setJoint(joint).move([x, 0, 0]); this.add(path);
    }
    await this.wait(3500);
  }
}
