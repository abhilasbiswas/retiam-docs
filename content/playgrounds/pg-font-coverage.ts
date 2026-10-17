import { CENTER, CameraModel, FontLoader, SDFText, Scene, hex } from 'retiam';

/** The font lookup reports whether a requested glyph exists before attempting to render it. */
export default class FontCoverageScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const font=await FontLoader.msdf('/src/assets/fonts/roboto-msdf.json');
    const supported=font.getCharInfo('A'),missing=font.getCharInfo('漢');
    const word=new SDFText('ABC',{font,fontSize:1,anchor:CENTER,fill:hex('#38bdf8')}).move([0,0.6,0]);
    const report=new SDFText('A: '+(supported?'present':'absent')+'  |  requested CJK glyph: '+(missing?'present':'absent'),{fontSize:0.3,anchor:CENTER}).move([0,-1,0]);this.add(word,report);await this.wait(3400);
  }
}
