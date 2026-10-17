import { CameraModel, Color, NONE, Path, Scene, hex } from 'retiam';

/** Two fast paths share the same cubic source but use coarse and fine tessellation tolerances. */
export default class PipelineToleranceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = 'M -2 -0.7 C -1 2 1 -2 2 0.7';
    const coarse = new Path(source,{method:'fast',tolerance:0.5,fill:Color.NONE,stroke:hex('#f59e0b'),strokeWidth:0.07}).move([0,1.1,0]);
    const fine = new Path(source,{method:'fast',tolerance:0.005,fill:Color.NONE,stroke:hex('#38bdf8'),strokeWidth:0.07}).move([0,-1.1,0]);
    this.add(coarse,fine);await this.wait(3200);
  }
}
