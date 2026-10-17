import { CENTER, CameraModel, CameraMove, Circle, SDFText, Scene, hex } from 'retiam';

/** A dedicated UI camera keeps one label still while the world camera pans. */
export default class FixedHudScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.composer!.setupUICamera({orthoScale: 7});
    const label = new SDFText('Fixed HUD', {fontSize: 0.42, anchor: CENTER}).move([0,2.3,0]).setAsUI();
    const circle = new Circle(0.8,{fill:hex('#38bdf8')});
    this.add(label,circle);
    await this.play(new CameraMove(this.camera,{position:[2.5,0,20],duration:2400}));
    await this.wait(1200);
  }
}
