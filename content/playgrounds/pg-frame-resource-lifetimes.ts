import { CENTER, CameraModel, Circle, PostProcessPass, Rect, SDFText, Scene, hex } from 'retiam';

/** The rendered pass chain reports real virtual texture handles, physical indices, and compiled lifetime intervals. */
export default class FrameResourceLifetimesScene extends Scene {
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

    await this.wait(500);
    const textures=this.renderer.frameGraph.textures.filter(t=>t.creator&&t.creator.name.match(/Luminance|Vignette/));
    const rows=textures.map(t=>t.creator!.name+' #'+t.handle.id+' → slot '+t.physical_index+' ['+t.firstPassIndex+', '+t.lastPassIndex+']');
    const label=new SDFText(rows.join('\n')||'No retained output handles',{fontSize:0.28,anchor:CENTER}).move([0,-2,0]);this.add(label);await this.wait(3000);
  }
}
