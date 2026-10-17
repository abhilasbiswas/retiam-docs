import { CameraModel, Morph, SDFBox, SDFEntity3D, SDFSphere, Scene, hex } from 'retiam';

/** One SDF sphere morphs into an SDF box. */
export default class MorphSdfScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const source = new SDFEntity3D(new SDFSphere(1.3));
    const target = new SDFEntity3D(new SDFBox(2.2,2.2,2.2));
    source.material.color = hex('#38bdf8'); target.material.color = hex('#f59e0b');
    this.add(source); this.camera.frame(source, {padding: 0.6});
    await this.wait(700); await this.play(Morph(source,target), {duration: 2400});
    await this.wait(1200);
  }
}
