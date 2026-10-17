import { CameraModel, Circle, Color, Entity, NONE, Rect, Scene, ZoomView, hex } from 'retiam';

/** A single small circle appears in a separate magnified view. */
export default class ZoomZoomviewScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const target = new Entity();
    target.add(new Circle(0.3,{fill:hex('#38bdf8')}).move([-2,0,0]), new Rect(2,2,{fill:Color.NONE,stroke:hex('#334155'),strokeWidth:0.04}).move([-2,0,0]));
    this.add(target);
    const zoom = new ZoomView(target, {focusPos:[-2,0,0],width:3,height:3,zoomFactor:3}).move([2,0,0]);
    this.add(zoom,zoom.focusBox);
    await this.wait(3200);
  }
}
