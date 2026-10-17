import { CENTER, CameraModel, FontCache, FontLoader, SDFText, Scene, hex } from 'retiam';

/** A named cache entry moves from absent to present while the cached font renders the same word. */
export default class FontCacheScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const font=await FontLoader.msdf('/src/assets/fonts/roboto-msdf.json');
    const key='docs:font-cache-probe';const before=FontCache.getMSDF(key);
    FontCache.setMSDF(key,font);const after=FontCache.getMSDF(key);
    this.add(new SDFText('ABC',{font:after,fontSize:1,anchor:CENTER,fill:hex('#38bdf8')}).move([0,0.6,0]));
    this.add(new SDFText('Before: '+(before?'hit':'miss')+' → after set: '+(after===font?'same font object':'different object'),{fontSize:0.3,anchor:CENTER}).move([0,-1,0]));await this.wait(3400);
  }
}
