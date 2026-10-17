import { CameraModel, CustomAnimation, Scene, Sphere, hex } from 'retiam';

/** A fixed sphere shows the changing shading from one moving directional light. */
export default class LightDirectionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const sphere=new Sphere(1.4);sphere.material.color=hex('#38bdf8');sphere.material.roughness=0.4;this.add(sphere);this.camera.frame(sphere,{padding:0.4});
    await this.play(new CustomAnimation(t=>this.composer!.light.position.set([-4+8*t,4,4]),{duration:3000}));await this.wait(1000);
  }
}
