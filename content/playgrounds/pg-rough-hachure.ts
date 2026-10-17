import { CameraModel, Rect, Scene, hex } from 'retiam';
import { RoughShape } from 'retiam/rough';

/** One rectangle uses the rough.js hachure fill style with a fixed seed. */
export default class RoughHachureScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const rough=new RoughShape(new Rect(3.8,2.5),{stroke:'#38bdf8',fill:'#38bdf8',fillStyle:'hachure',roughness:1,seed:7});this.add(rough);await this.wait(3200);
  }
}
