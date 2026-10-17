import { Arrange, CameraModel, Circle, Scene, hex } from 'retiam';

/** The same twelve-item grid uses CPU entities. */
export default class ArrangeCpuScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const grid=new Arrange(new Circle(0.22,{fill:hex('#38bdf8')}),12,{gpu:false}).arrangeGrid(3,4,0.35);
    this.add(grid);await this.wait(1000);
    grid.forAll((i,dot)=>{if(i===5)dot.setFill(hex('#f59e0b'));});grid.syncGPU();this.invalidate();await this.wait(1800);
  }
}
