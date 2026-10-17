import { CameraModel, Color, NONE, Path, Scene, hex } from 'retiam';

/** The same cubic contour is rendered with the auto path method. */
export default class PipelineAutoScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const curve = new Path('M -3 -1 C -1 3 1 -3 3 1', {method:'auto',fill:Color.NONE,stroke:hex('#38bdf8'),strokeWidth:0.11,tolerance:0.02});
    this.add(curve);await this.wait(3200);
  }
}
