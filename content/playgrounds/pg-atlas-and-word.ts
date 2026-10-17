import { CENTER, CameraModel, FontLoader, RTImage, SDFText, Scene, hex } from 'retiam';

/** A pre-baked MSDF atlas appears beside the short word that consumes its glyph cells. */
export default class AtlasAndWordScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const font=await FontLoader.msdf('/src/assets/fonts/roboto-msdf.json');
    const atlas=new RTImage(3.5,3.5,'/src/assets/fonts/roboto-msdf.png').move([-2,0,0]);
    const word=new SDFText('ABC',{font,fontSize:1,anchor:CENTER,fill:hex('#38bdf8')}).move([2,0,0]);this.add(atlas,word);await this.wait(3400);
  }
}
