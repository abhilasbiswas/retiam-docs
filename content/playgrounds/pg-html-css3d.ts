import { CameraModel, RTHTML, Scene, hex } from 'retiam';
import { HTMLRenderMode } from 'retiam';

/** A tiny self-contained HTML surface uses the explicit CSS3D rendering mode. */
export default class HtmlCss3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const surface = new RTHTML(5, 2.4, undefined, {mode: HTMLRenderMode.CSS3D});
    await surface.load('<div style="margin:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#38bdf8;font:32px sans-serif">Hello, HTML</div>');
    this.add(surface);
    await this.play(surface.animate.rotate(0.12), {duration: 1400});
    await this.wait(1600);
  }
}
