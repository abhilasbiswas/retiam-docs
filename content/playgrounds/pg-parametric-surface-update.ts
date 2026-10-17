import { CameraModel, CustomAnimation, ParametricModel, Scene, Vec3, hex } from 'retiam';

/** A small grid bends continuously while retaining its vertex correspondence. */
export default class ParametricSurfaceUpdateScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const surface = new ParametricModel((u,v) => new Vec3((u-0.5)*4, 0, (v-0.5)*4), {uSegments: 18, vSegments: 18, color: hex('#38bdf8')});
    this.add(surface);
    await this.play(new CustomAnimation(t => surface.updateSurface((u,v) => new Vec3((u-0.5)*4, Math.sin(u*Math.PI*2)*Math.sin(v*Math.PI)*t, (v-0.5)*4)), {duration: 2200}));
    await this.wait(1200);
  }
}
