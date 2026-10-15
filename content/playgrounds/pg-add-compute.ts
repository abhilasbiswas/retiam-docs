import { Scene, CameraModel, Shader, ComputeKernel, Res, hex } from 'retiam';

/** Scene.addCompute dispatches one kernel that supplies one shader surface. */
export default class AddComputeExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 6;

    const values = this.device.createBuffer({ size: 64 * 16, usage: GPUBufferUsage.STORAGE });
    const kernel = new ComputeKernel({ values: Res.buffer('array<vec4f>', values, 'read_write') }, `
      let i = global_id.x;
      if (i < 64u) {
        let x = f32(i) / 63.0;
        values[i] = vec4f(x, 0.25, 1.0 - x, 1.0);
      }
    `, [64, 1, 1]);
    const surface = new Shader(6, 2.2, `
      let i = min(u32(input.uv.x * 64.0), 63u);
      finalColor = values[i];
    `);
    surface.setStorageBuffer('values', 'array<vec4f>', values, 'read');
    this.add(surface);
    const updater = this.always(() => this.addCompute(kernel.dispatch(this.device, 1)));
    await this.wait(3600);
    updater.stop();
    values.destroy();
  }
}
