import { Scene, Component, Circle, Rect, PostProcessPass, CameraModel, InteractionManager, hex } from 'retiam';
import type { IPlugin, FrameGraph, GraphBuilder, Renderer, RenderIO, AlwaysHandle, Entity, TextureHandle } from 'retiam';

class RotationPlugin implements IPlugin {
  readonly name = 'TutorialRotation';
  private task?: AlwaysHandle;
  constructor(private target: Entity, private speed = 0.5) {}
  install(scene?: Scene) {
    this.task?.stop();
    this.task = scene?.always((_time, dt) => { this.target.rotate(this.speed * dt / 1000); });
  }
  dispose() { this.task?.stop(); this.task = undefined; }
}

// Plugin effects run before antialiasing, at the renderer's supersampled size.
class PreAAPass extends PostProcessPass {
  constructor(input: TextureHandle, private scale: number, shader: string) { super('Plugin luminance', input, shader); }
  setup(builder: GraphBuilder) {
    builder.createTexture(this.outputTexture, {
      format: navigator.gpu.getPreferredCanvasFormat(), mode: 'relative', scale: this.scale,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    builder.markUnculled();
  }
}

class HalfLuminancePlugin implements IPlugin {
  readonly name = 'TutorialHalfLuminance';
  readonly priority = 200;
  registerPasses(graph: FrameGraph, renderer: Renderer, io: RenderIO): RenderIO {
    const pass = new PreAAPass(io.resolvedColor, renderer.config.AA,
      PostProcessPass.getDefaultShader(`
        let gray = dot(color.rgb, vec3f(0.2126, 0.7152, 0.0722));
        return vec4f(select(color.rgb, vec3f(gray), uv.x > 0.5), color.a);
      `));
    graph.addPass(pass);
    io.resolvedColor = pass.presentationOutput;
    return io;
  }
}

class PluginOwner extends Component {
  constructor(private scene: Scene) { super(); }
  onDestroy() { this.scene.removePlugin('TutorialRotation'); this.scene.removePlugin('TutorialHalfLuminance'); }
}

export default class PluginTutorial extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.ALWAYS_UPDATE = true;
    new InteractionManager(this);
    const toggle = new Circle(0.8, { fill: hex('#38bdf8') }); toggle.move([-1.5, 0, 0]);
    const tile = new Rect(1.6, 1.6, { fill: hex('#f59e0b') }); tile.move([1.5, 0, 0]);
    this.add(toggle, tile);
    toggle.addComponent(new PluginOwner(this));
    this.camera.orthoScale = 4;
    this.use(new RotationPlugin(tile)); this.use(new HalfLuminancePlugin());
    toggle.setEvent('click', () => {
      if (this.hasPlugin('TutorialHalfLuminance')) this.removePlugin('TutorialHalfLuminance');
      else this.use(new HalfLuminancePlugin());
      this.invalidate();
    });
    tile.setEvent('click', () => {
      if (this.hasPlugin('TutorialRotation')) this.removePlugin('TutorialRotation');
      else this.use(new RotationPlugin(tile));
      this.invalidate();
    });
  }
}
