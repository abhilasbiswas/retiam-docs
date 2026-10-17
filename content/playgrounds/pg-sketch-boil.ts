import { CameraModel, Rect, Scene, hex } from 'retiam';

/** The linework changes while boiling and freezes when stopBoil is called. */
export default class SketchBoilScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(3.5, 2.2);
    shape.toExcalidraw({ preset: 'normal', seed: 7, stroke: '#38bdf8', strokeWidth: 0.04 });
    this.add(shape);
    shape.startBoil({ fps: 8 });
    await this.wait(1800);
    shape.stopBoil(); this.invalidate();
    await this.wait(1600);
  }
}
