import { Arrange, CameraModel, Circle, Scene, hex } from 'retiam';

/** Twelve stable items demonstrate one layout animation. */
export default class LayoutRippleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const grid=new Arrange(new Circle(0.22,{fill:hex('#38bdf8')}),12).arrangeGrid(3,4,0.4);this.add(grid);
    await this.play(grid.ripple({origin:[-2,0,0],scalePeak:1.7,duration:2200}));await this.wait(1200);
  }
}
