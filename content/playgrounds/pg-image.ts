import { Scene, RTImage, hex } from 'retiam';

/** One raster asset, loaded and displayed at an explicit scene size. */
export default class ImageExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.renderConfig.raytraceEnabled = false;
    this.camera.position.set([0, 0, 15]);
    this.camera.lookAt([0, 0, 0]);

    const image = new RTImage(8, 4.5, '/res/media/image.jpg');
    this.add(image);
    this.camera.frame(image, { padding: 0.28 });
    await this.wait(2600);
  }
}
