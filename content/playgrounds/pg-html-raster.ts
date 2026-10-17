import { CENTER, SDFText, CameraModel, RTHTML, Scene, hex } from 'retiam';
import { HTMLRenderMode } from 'retiam';

/** A tiny self-contained HTML surface uses the explicit RASTER rendering mode. */
export default class HtmlRasterScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    // RTHTML's SVG/foreignObject path depends on the browser decoder.
    // Probe it before constructing the surface so unsupported browsers get
    // a clear capability result instead of a blank quad.
    try {
      const probe = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><foreignObject width="8" height="8"><div xmlns="http://www.w3.org/1999/xhtml">HTML</div></foreignObject></svg>'], {type:'image/svg+xml'});
      const bitmap = await createImageBitmap(probe); bitmap.close();
    } catch {
      const message = new SDFText('HTML rasterization is unavailable', {fontSize:0.42,anchor:CENTER,fill:hex('#f59e0b')});
      const alternative = new SDFText('Use CSS3D for live HTML, or RTImage for capture.', {fontSize:0.28,anchor:CENTER}).move([0,-0.8,0]);
      this.add(message,alternative); await this.wait(3200); return;
    }
    const surface = new RTHTML(5, 2.4, undefined, {mode: HTMLRenderMode.RASTER});
    await surface.load('<div style="margin:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#38bdf8;font:32px sans-serif">Hello, HTML</div>');
    this.add(surface);
    await this.play(surface.animate.rotate(0.12), {duration: 1400});
    await this.wait(1600);
  }
}
