import { Camera2DController, CameraModel, Circle, Color, NONE, Rect, Scene, Vec3, hex } from 'retiam';

/** The marked world point stays under the chosen canvas coordinate while the camera zooms. */
export default class CameraZoomAtScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.24, {fill: hex('#f59e0b')}).move([1.5, 0, 0]);
    this.add(new Rect(5, 3, {fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.05}), dot);
    const controller = new Camera2DController(this, this.camera, {enableKeys: false, enablePan: false, enableTouch: false, enableZoom: false});
    const anchor = controller.worldToScreen(new Vec3(1.5, 0, 0));
    await this.wait(700);
    await this.play(controller.animate.zoomAt(anchor.x, anchor.y, 3.5), {duration: 2200});
    await this.wait(1200); controller.destroy();
  }
}
