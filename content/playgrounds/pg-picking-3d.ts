import { CameraModel, InteractionManager, Scene, Sphere, Vec3, hex } from 'retiam';

/** Clicking a sphere places an amber marker at the actual raycast surface hit. */
export default class Picking3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    new InteractionManager(this);
    const sphere=new Sphere(1.4,{shading:'manim',color:hex('#38bdf8')});const marker=new Sphere(0.07,{shading:'manim',color:hex('#f59e0b')});marker.VISIBILITY=false;
    this.add(sphere,marker);this.camera.frame(sphere,{padding:0.6});
    sphere.setEvent('click',(_event:PointerEvent,hit?:{point:Vec3})=>{if(!hit)return;marker.move(hit.point);marker.VISIBILITY=true;this.invalidate();});await this.wait(7000);
  }
}
