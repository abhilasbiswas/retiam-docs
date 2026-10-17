import { CameraModel, CustomAnimation, Scene, Sphere, hex } from 'retiam';

/** Three depth-separated spheres use path-traced aperture and focus distance. */
export default class DepthOfFieldScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.renderConfig.raytraceEnabled=true;this.renderConfig.rtSamples=2;this.renderConfig.rtMaxAccumulation=16;this.ALWAYS_UPDATE=true;
    this.camera.position.set([0,0,8]);this.camera.lookAt([0,0,0]);this.camera.fov=Math.PI/4;this.camera.aperture=0.22;this.camera.focusDist=6.5;
    for(let i=0;i<3;i++){const sphere=new Sphere(0.55);sphere.move([(i-1)*1.4,0,1.5-i*1.5]);sphere.material.color=hex(i===1?'#f59e0b':'#38bdf8');this.add(sphere);}
    await this.wait(1400);await this.play(new CustomAnimation(t=>{this.camera.focusDist=6.5+3*t;},{duration:2400}));await this.wait(1400);
  }
}
