import { Scene, CameraModel, Circle, PostProcessPass, hex } from 'retiam';

/** One post-process pass converts the right half of the frame to luminance. */
export default class PostProcessExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    this.add(new Circle(1.6, { fill: hex('#38bdf8') }));
    const shader = PostProcessPass.getDefaultShader(`
      let value = dot(color.rgb, vec3f(0.2126, 0.7152, 0.0722));
      return vec4f(select(color.rgb, vec3f(value), uv.x > 0.5), color.a);
    `);
    this.addPass(new PostProcessPass('Luminance', this.renderer.finalOutputHandle, shader));
    await this.wait(2600);
  }
}
