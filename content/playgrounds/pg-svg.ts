import { Scene, CameraModel, SVG, hex } from 'retiam';

/** Parse one inline SVG document into vector geometry. */
export default class SVGExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    const artwork = new SVG(`
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 8 L62 36 L92 38 L69 58 L76 90 L50 72 L24 90 L31 58 L8 38 L38 36 Z"
          fill="#38bdf8" stroke="#f8fafc" stroke-width="3"/>
      </svg>`);
    this.add(artwork);
    this.camera.frame(artwork, { padding: 0.28 });
    await this.wait(2400);
  }
}
