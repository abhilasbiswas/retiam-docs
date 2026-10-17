import { Arrow, CameraModel, Circle, Scene, hex } from 'retiam';

/** One arrow follows a moving endpoint while its head remains attached to the shaft. */
export default class ArrowLiveEndpointScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const arrow=new Arrow([-2,-0.5,0],[2,0.5,0],{stroke:hex('#38bdf8'),strokeWidth:0.07});
    const end=new Circle(0.15,{fill:hex('#f59e0b')}).move([2,0.5,0]);this.add(arrow,end);
    this.always(()=>arrow.putStartAndEndOn([-2,-0.5,0],end.transform.position),{phase:'post'});
    await this.play(end.animate.move([1,1.8,0]),{duration:2200});await this.wait(1200);
  }
}
