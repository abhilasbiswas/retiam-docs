import { Scene, Circle, Rect, PostProcessPass, CameraModel, hex } from 'retiam';

export default class FrameGraphTutorial extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    const circle = new Circle(0.8, { fill: hex('#38bdf8') }); circle.move([-1.5, 0, 0]);
    const tile = new Rect(1.6, 1.6, { fill: hex('#f59e0b') }); tile.move([1.5, 0, 0]);
    this.add(circle, tile);
    this.camera.orthoScale = 4;
    const gray = new PostProcessPass('Right half luminance', this.renderer.finalOutputHandle,
      PostProcessPass.getDefaultShader(`
        let luminance = dot(color.rgb, vec3f(0.2126, 0.7152, 0.0722));
        return vec4f(select(color.rgb, vec3f(luminance), uv.x > 0.5), color.a);
      `));
    // The second pass reads the first pass's output, declaring a real dependency.
    const vignette = new PostProcessPass('Vignette', gray.presentationOutput,
      PostProcessPass.getDefaultShader(`
        let edge = smoothstep(0.2, 0.7, length(uv - vec2f(0.5)));
        return vec4f(color.rgb * (1.0 - 0.5 * edge), color.a);
      `));
    this.addPass(gray); this.addPass(vignette);
    await this.play(tile.animate.rotate(Math.PI / 4), { duration: 1600 });
    await this.wait(500);
  }
}
