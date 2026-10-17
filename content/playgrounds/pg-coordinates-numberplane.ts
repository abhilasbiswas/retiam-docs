import { CameraModel, Create, Dot, FadeIn, NumberPlane, Scene, hex } from 'retiam';

/** A marked mathematical point is mapped through one coordinate system. */
export default class CoordinatesNumberplaneScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new NumberPlane({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], width: 6, height: 4, showLabels: false });
    const marker = new Dot(axes.c2p(2, 1), { radius: 0.1, fill: hex('#f59e0b') });
    this.add(axes, marker);
    await this.play(new Create(axes), new FadeIn(marker), { duration: 1400 });
    await this.wait(1800);
  }
}
