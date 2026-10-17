import { CameraModel, CrystallizeIn, Scene, Sphere, hex } from 'retiam';

/** A single sphere isolates the animation of material appearance. */
export default class RevealCrystallizeinScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const shape = new Sphere(1.25);
    shape.setColor(hex('#38bdf8')).setRoughness(0.2).setMetallic(0.65);
    this.add(shape);
    await this.play(new CrystallizeIn(shape), { duration: 2100 });
    await this.wait(1500);
  }
}
