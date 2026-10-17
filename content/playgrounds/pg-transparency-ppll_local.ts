import { Box, CameraModel, Scene, hex } from 'retiam';
import { PPLL_Method } from 'retiam';

/** Two intersecting translucent planes reveal overlapping coverage. */
export default class TransparencyPpll_localScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.renderConfig.PPLL=PPLL_Method.PPLL_LOCAL;
    const a=new Box(3,2.5,0.06),b=new Box(3,2.5,0.06);
    a.material.color=hex('#38bdf8');b.material.color=hex('#f59e0b');a.material.opacity=0.5;b.material.opacity=0.5;
    a.rotate([0,0.6,0]);b.rotate([0,-0.6,0]);this.add(a,b);this.camera.frame([a,b],{padding:0.45});
    await this.wait(3600);
  }
}
