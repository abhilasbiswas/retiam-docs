import { Box, CameraModel, CameraOrbit, Scene, hex } from 'retiam';

/** One fixed box makes the effect of camera orbit visible. */
export default class CameraOrbitScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const box = new Box(1.8, 1.8, 1.8, {shading: 'manim', color: hex('#38bdf8')});
    this.add(box);
    this.camera.frame(box, {padding: 0.65});
    await this.wait(700);
    await this.play(new CameraOrbit(this.camera, box, Math.PI / 2, {duration: 2600}));
    await this.wait(1200);
  }
}
