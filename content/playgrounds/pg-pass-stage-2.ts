import { CameraModel, Circle, PostProcessPass, Rect, Scene, hex } from 'retiam';

/** A real image-pass chain is shown at one specific stage. */
export default class PassStage2Scene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.add(new Circle(0.85,{fill:hex('#38bdf8')}).move([-1.5,0,0]),new Rect(1.7,1.7,{fill:hex('#f59e0b')}).move([1.5,0,0]));
    const gray=new PostProcessPass('Luminance',this.renderer.finalOutputHandle,PostProcessPass.getDefaultShader('let l=dot(color.rgb,vec3f(0.2126,0.7152,0.0722)); return vec4f(vec3f(l),color.a);'));
    this.addPass(gray);
    const vignette=new PostProcessPass('Vignette',gray.presentationOutput,PostProcessPass.getDefaultShader('let edge=smoothstep(0.1,0.65,length(uv-vec2f(0.5))); return vec4f(color.rgb*(1.0-edge*0.65),color.a);'));
    this.addPass(vignette);
    await this.wait(3400);
  }
}
