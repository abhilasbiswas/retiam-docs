import { Scene, Component, Shader, ComputeKernel, Res, Renderer, CameraModel, InteractionManager, hex } from 'retiam';

class BufferOwner extends Component {
  private retired = false;
  constructor(private buffers: GPUBuffer[]) { super(); }
  onDestroy() { if (!this.retired) { this.retired = true; Renderer.destroyBuffers(...this.buffers); } }
}

export default class ComputeKernelTutorial extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.ALWAYS_UPDATE = true;
    new InteractionManager(this);
    const side = 64, count = side * side;
    const pixels = this.device.createBuffer({ size: count * 16, usage: GPUBufferUsage.STORAGE });
    const params = this.device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const values = new Float32Array([0, side, count, 0]);
    // Named resources supply declarations. This string is the compute entry's body.
    const kernel = new ComputeKernel({ pixels: Res.buffer('array<vec4f>', pixels, 'read_write'), params: Res.uniform('vec4f', params) }, `
      let i = global_id.x;
      if (i >= u32(params.z)) { return; }
      let side = u32(params.y);
      let uv = vec2f(f32(i % side), f32(i / side)) / params.y;
      let amount = 0.5 + 0.5 * sin(length(uv - vec2f(0.5)) * 24.0 - params.x * 2.0);
      pixels[i] = mix(vec4f(0.02, 0.65, 0.95, 1.0), vec4f(0.96, 0.55, 0.02, 1.0), amount);
    `, [64, 1, 1]);
    const surface = new Shader(6, 4, `
      let cell = min(vec2u(input.uv * 64.0), vec2u(63u));
      finalColor = pixels[cell.y * 64u + cell.x];
    `);
    surface.setStorageBuffer('pixels', 'array<vec4f>', pixels, 'read');
    surface.addComponent(new BufferOwner([pixels, params]));
    this.add(surface);
    this.camera.orthoScale = 5;
    let running = true;
    // Scene clicks supply world coordinates even when the shader has no picking geometry.
    this.setEvent('click', position => {
      if (Math.abs(position.x) <= 3 && Math.abs(position.y) <= 2) running = !running;
    });
    this.always((_time, dt) => {
      if (running) values[0] += dt / 1000;
      this.device.queue.writeBuffer(params, 0, values);
      this.addCompute(kernel.dispatch(this.device, Math.ceil(count / 64)));
      this.invalidate();
    });
  }
}
