import { Box, CameraModel, MaterializeFrom, MathShape3D, Scene, hex } from 'retiam';

/** The wireframe and surface of one solid reveal their separate construction stages. */
export default class RevealMaterializefromScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const shape = MathShape3D.Box(2.2, 2.2, 2.2, { fill: hex('#38bdf8'), stroke: hex('#e2e8f0'), stroke_width: 0.035 });
    this.add(shape);
    await this.play(new MaterializeFrom(shape), { duration: 2400 });
    await this.wait(1600);
  }
}
