import { Box, CameraModel, Scene, hex } from 'retiam';

/** Three identical boxes at different depths show the TWO_POINT projection. */
export default class ProjectionTwo_pointScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.camera.model = CameraModel.TWO_POINT;
    this.camera.position.set([5, 3, 11]); this.camera.lookAt([0, 0, 0]); this.camera.orthoScale = 8;
    for (let i = 0; i < 3; i++) {
     const box = new Box(1.5, 1.5, 1.5, {shading: 'manim', color: hex(i === 1 ? '#f59e0b' : '#38bdf8')}).move([(i - 1) * 2.4, 0, (i - 1) * -2]);
     this.add(box);
    }
    await this.wait(3600);
  }
}
