import { CameraModel, Circle, Rect, Scene, hex } from 'retiam';

/** Two shapes occupy different layers; the camera displays each layer separately. */
export default class LayerToggleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const circle = new Circle(0.8, {fill: hex('#38bdf8')}).move([-1.5,0,0]).setLayers([0]);
    const square = new Rect(1.6,1.6,{fill:hex('#f59e0b')}).move([1.5,0,0]).setLayers([1]);
    this.add(circle,square);
    await this.wait(900); this.camera.seeOnlyLayers([0]); this.invalidate();
    await this.wait(1100); this.camera.seeOnlyLayers([1]); this.invalidate();
    await this.wait(1100); this.camera.seeOnlyLayers([0,1]); this.invalidate();
    await this.wait(1100);
  }
}
