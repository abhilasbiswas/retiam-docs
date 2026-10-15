import { Scene, Circle, Rect, SDFText, PostProcessPass, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

export default class PostProcessWorkshop extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.ALWAYS_UPDATE = true;
    this.camera.orthoScale = 7;
    new InteractionManager(this);
    const circle = new Circle(0.85, { fill: hex('#38bdf8') }); circle.move([-1.6, 0, 0]);
    const box = new Rect(1.7, 1.7, { fill: hex('#f59e0b') }); box.move([1.6, 0, 0]);
    const label = new SDFText('Color on the left | luminance on the right', { fontSize: 0.3, anchor: CENTER, fill: hex('#e2e8f0') });
    label.move([0, 2.3, 0]); this.add(circle, box, label);
    const code = PostProcessPass.getDefaultShader(`
      let gray = dot(color.rgb, vec3f(0.2126, 0.7152, 0.0722));
      let rgb = select(color.rgb, vec3f(gray), uv.x > 0.5);
      return vec4f(rgb, color.a);
    `);
    this.addPass(new PostProcessPass('Half luminance', this.renderer.finalOutputHandle, code));
    let direction = 1;
    circle.setEvent('click', () => { direction *= -1; }); box.setEvent('click', () => { direction *= -1; });
    this.always((_time, dt) => { box.rotate(direction * dt / 1500); });
  }
}
