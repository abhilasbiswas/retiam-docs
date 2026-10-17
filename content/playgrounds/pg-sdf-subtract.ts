import { CameraModel, SDFBox, SDFEntity3D, SDFSphere, Scene, hex } from 'retiam';

/** One raymarched object isolates the subtract distance-field operation. */
export default class SdfSubtractScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const object = new SDFEntity3D(new SDFSphere(1.5).subtract(new SDFBox(1.4,1.4,4)), {padding: 0.4});
    object.material.color = hex('#38bdf8'); this.add(object);
    this.camera.frame(object, {padding: 0.4});
    await this.play(object.animate.rotate([0,0.6,0]), {duration: 1800});
    await this.wait(1200);
  }
}
