import { Scene, CameraModel, Circle, Rect, PostProcessPass, hex } from 'retiam';

/** Two passes expose one explicit producer-to-consumer frame-graph edge. */
export default class FrameGraphExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    this.add(
      new Circle(0.9, { fill: hex('#38bdf8') }).move([-1.5, 0, 0]),
      new Rect(1.8, 1.8, { fill: hex('#f59e0b') }).move([1.5, 0, 0]),
    );

    const luminance = new PostProcessPass(
      'Luminance',
      this.renderer.finalOutputHandle,
      PostProcessPass.getDefaultShader(`
        let value = dot(color.rgb, vec3f(0.2126, 0.7152, 0.0722));
        return vec4f(select(color.rgb, vec3f(value), uv.x > 0.5), color.a);
      `),
    );
    const vignette = new PostProcessPass(
      'Vignette',
      luminance.presentationOutput,
      PostProcessPass.getDefaultShader(`
        let edge = smoothstep(0.2, 0.7, length(uv - vec2f(0.5)));
        return vec4f(color.rgb * (1.0 - 0.45 * edge), color.a);
      `),
    );
    this.addPass(luminance);
    this.addPass(vignette);
    await this.wait(2600);
  }
}
