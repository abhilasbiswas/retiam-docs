import { CameraModel, Entity, Scene, ShimmerIn, Sphere, hex } from 'retiam';

/** A highlight travels across three material-bearing child objects. */
export default class RevealShimmerScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const group = new Entity();
    for (let i = 0; i < 3; i++) {
      const sphere = new Sphere(0.55).move([(i - 1) * 1.4, 0, 0]);
      sphere.setColor(hex('#38bdf8')).setRoughness(0.25); group.add(sphere);
    }
    this.add(group);
    await this.play(new ShimmerIn(group, { lagRatio: 0.2, peakEmStrength: 3 }), { duration: 2200 });
    await this.wait(1400);
  }
}
