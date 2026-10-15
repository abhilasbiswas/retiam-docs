import { Scene, CameraModel, Circle, Rect, Sprite, RenderTarget, Color, hex } from 'retiam';

/** One offscreen target is displayed as a texture in the main scene. */
export default class RenderTargetExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 8;
    this.ALWAYS_UPDATE = true;

    const target = new RenderTarget(this, 'FocusedOffscreen', { width: 256, height: 256, type: 'offscreen' });
    const captured = new Circle(36, { fill: hex('#38bdf8'), stroke: Color.NONE });
    target.capture(captured);

    const frame = new Rect(5.4, 5.4, { fill: hex('#0f172a'), stroke: hex('#f59e0b'), strokeWidth: 0.07 });
    const output = new Sprite(5, 5, target.texture!);
    output.transform.position.z = 0.01;
    this.add(frame, output);
    this.always(() => {
      captured.move([Math.sin(this.time * 0.002) * 70, 0, 0]);
      this.invalidate();
    });
    await this.wait(3000);
  }
}
