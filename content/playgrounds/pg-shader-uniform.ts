import { Scene, CameraModel, Shader, hex } from 'retiam';

/** One float uniform controls one fragment-shader pulse. */
export default class ShaderUniformExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const shader = new Shader(8, 4.5, `
      let centered = (input.uv - vec2f(0.5)) * vec2f(1.7778, 1.0);
      let radius = length(centered);
      let ring = smoothstep(0.035, 0.0, abs(radius - pulse.value.x));
      finalColor = vec4f(vec3f(0.22, 0.74, 0.97) * ring, 1.0);
    `, { userFunctions: 'struct Pulse { value: vec4f };' });
    const buffer = this.device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    shader.setUniformBuffer('pulse', 'Pulse', buffer);
    this.add(shader);
    this.always(() => {
      const radius = 0.18 + 0.2 * (0.5 + 0.5 * Math.sin(this.time * 0.002));
      this.device.queue.writeBuffer(buffer, 0, new Float32Array([radius, 0, 0, 0]));
      this.invalidate();
    });
    await this.wait(3000);
  }
}
