import { Box, CameraModel, Scene, hex } from 'retiam';

/** Two viewports inspect the same box from independent camera positions. */
export default class TwoViewsScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const box=new Box(2,2,2,{shading:'manim',color:hex('#38bdf8')});this.add(box);
    const left=this.default_view;left.viewport={x:0,y:0,w:0.5,h:1};left.width=this.canvas.width/2;
    left.camera.model=CameraModel.PERSPECTIVE;left.camera.position.set([0,0,7]);left.camera.lookAt(box);
    const right=this.composer!.createView(this.canvas.width/2,this.canvas.height);right.viewport={x:0.5,y:0,w:0.5,h:1};right.clearDepth=true;right.clearColor=false;
    right.camera.model=CameraModel.PERSPECTIVE;right.camera.position.set([4,2.5,6]);right.camera.lookAt(box);right.init(this.device);this.composer!.VIEWS_DIRTY=true;
    await this.wait(3400);
  }
}
