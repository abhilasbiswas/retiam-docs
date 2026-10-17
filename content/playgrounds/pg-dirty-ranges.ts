import { CENTER, CameraModel, DirtyBufferTracker, Rect, SDFText, Scene, hex } from 'retiam';

/** A DirtyBufferTracker merges two adjacent writes and keeps a separate distant write. */
export default class DirtyRangesScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const tracker=new DirtyBufferTracker(0);
    tracker.markDirty(8,8);tracker.markDirty(16,8);tracker.markDirty(48,4);
    const merged=tracker.coalesce(64);
    for(let i=0;i<16;i++){
     const dirty=merged.some(range=>i*4>=range.start&&i*4<range.end);
     this.add(new Rect(0.38,0.7,{fill:hex(dirty?'#38bdf8':'#1e293b')}).move([(i-7.5)*0.43,0,0]));
    }
    this.add(new SDFText(merged.map(r=>'['+r.start+', '+r.end+')').join('  '),{fontSize:0.4,anchor:CENTER}).move([0,-1.3,0]));
    await this.wait(3400);
  }
}
