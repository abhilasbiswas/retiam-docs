import { CameraModel, Circle, PostProcessPass, Rect, Scene, hex } from 'retiam';

/** A luminance pass is added, removed, and added again on the same retained scene. */
export default class PassToggleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.add(new Circle(0.85,{fill:hex('#38bdf8')}).move([-1.5,0,0]),new Rect(1.7,1.7,{fill:hex('#f59e0b')}).move([1.5,0,0]));

    const pass=new PostProcessPass('Toggle luminance',this.renderer.finalOutputHandle,PostProcessPass.getDefaultShader('let l=dot(color.rgb,vec3f(0.2126,0.7152,0.0722));return vec4f(vec3f(l),color.a);'));
    await this.wait(800);this.addPass(pass);this.invalidate();await this.wait(1200);
    this.removePass(pass);this.invalidate();await this.wait(1200);this.addPass(pass);this.invalidate();await this.wait(1400);
  }
}
