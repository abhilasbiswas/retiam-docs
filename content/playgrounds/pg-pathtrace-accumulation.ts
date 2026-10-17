import { CENTER, CameraModel, SDFText, Scene, Sphere, hex } from 'retiam';

/** A static path-traced sphere reports the renderer accumulation counter, then a material change restarts sampling. */
export default class PathtraceAccumulationScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.renderConfig.raytraceEnabled=true;this.renderConfig.rtSamples=1;this.renderConfig.rtMaxAccumulation=24;this.ALWAYS_UPDATE=true;
    const sphere=new Sphere(1.1);sphere.material.color=hex('#38bdf8');this.add(sphere);this.camera.frame(sphere,{padding:0.7});
    const counter=new SDFText('Accumulating',{fontSize:0.3,anchor:CENTER}).move([0,-1.8,0]);this.add(counter);
    this.always(()=>counter.setText('Accumulated frames: '+this.renderer.raytraceManager.accumulatedFrames),{interval:200});
    await this.wait(2400);sphere.material.roughness=0.8;this.renderer.raytraceManager.resetAccumulation();this.invalidate();await this.wait(2400);
  }
}
