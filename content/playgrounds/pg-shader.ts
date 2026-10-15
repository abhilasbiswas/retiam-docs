import { Scene, CameraModel, Shader, hex } from 'retiam';

/** One Shader draws a procedural horizontal color blend. */
export default class ShaderExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const surface = new Shader(7, 3.5, `
      let left = vec3f(0.02, 0.65, 0.95);
      let right = vec3f(0.96, 0.55, 0.02);
      finalColor = vec4f(mix(left, right, input.uv.x), 1.0);
    `);
    this.add(surface);
    await this.wait(2600);
  }
}
