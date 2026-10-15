import { Scene, Component, Shader, UniformSchema, UniformBufferData, DataType, Renderer, CameraModel, InteractionManager, hex } from 'retiam';

class BufferOwner extends Component {
  private retired = false;
  constructor(private buffer: GPUBuffer) { super(); }
  onDestroy() { if (!this.retired) { this.retired = true; Renderer.destroyBuffers(this.buffer); } }
}

export default class UniformWorkshop extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.ALWAYS_UPDATE = true;
    this.camera.orthoScale = 7;
    new InteractionManager(this);
    const schema = new UniformSchema('Palette', { focus: DataType.vec2f, cyan: DataType.vec4f, amber: DataType.vec4f, mixAmount: DataType.f32 });
    const data = new UniformBufferData(schema);
    data.set('focus', [0.5, 0.5]);
    data.set('cyan', [0.02, 0.65, 0.95, 1]); data.set('amber', [0.96, 0.55, 0.02, 1]);
    const buffer = this.device.createBuffer({ size: schema.byteSize, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    // Resource declarations add the binding. Only the struct belongs in userFunctions.
    const struct = schema.generateWGSL(0, 0, false);
    const surface = new Shader(6, 4, `
      let d = distance(input.uv, palette.focus);
      let ring = 0.5 + 0.5 * cos(d * 30.0 - palette.mixAmount * 6.283185);
      finalColor = mix(palette.cyan, palette.amber, ring);
    `, { userFunctions: struct });
    surface.setUniformBuffer('palette', 'Palette', buffer);
    surface.addComponent(new BufferOwner(buffer)); this.add(surface);
    let animated = true, elapsed = 0;
    // Scene clicks supply world coordinates even when the shader has no picking geometry.
    this.setEvent('click', position => {
      if (Math.abs(position.x) <= 3 && Math.abs(position.y) <= 2) animated = !animated;
    });
    this.always((_time, dt) => {
      if (animated) elapsed += dt / 1000;
      data.set('mixAmount', elapsed);
      this.device.queue.writeBuffer(buffer, 0, data.buffer);
      this.invalidate();
    });
  }
}
