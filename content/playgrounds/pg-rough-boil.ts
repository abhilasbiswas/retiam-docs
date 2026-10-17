import { CameraModel, Rect, Scene, hex } from 'retiam';
import { RoughShape } from 'retiam/rough';

/** A seeded rough rectangle changes its linework, then freezes after stopBoil. */
export default class RoughBoilScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const rough=new RoughShape(new Rect(3.8,2.5),{stroke:'#38bdf8',roughness:1,seed:7});this.add(rough);
    await this.wait(700);rough.startBoil({fps:8});await this.wait(2000);rough.stopBoil();await this.wait(1200);
  }
}
