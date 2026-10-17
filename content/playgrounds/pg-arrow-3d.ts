import { Arrow3D, CameraModel, Scene, hex } from 'retiam';

/** One Arrow3D marks a direction in space using a tube shaft and cone head. */
export default class Arrow3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const arrow=new Arrow3D([-1.5,-1,0],[1.5,1.2,1],{color:hex('#38bdf8'),headLength:0.45,headRadius:0.18});this.add(arrow);this.camera.frame(arrow,{padding:0.5});await this.wait(3400);
  }
}
