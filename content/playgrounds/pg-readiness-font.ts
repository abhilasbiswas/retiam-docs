import { CENTER, CameraModel, Line, Scene, Text, hex } from 'retiam';

/** A local vector font loads before text bounds are used to fit an underline. */
export default class ReadinessFontScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    await Text.loadFonts('/fonts/Hiragenda.ttf');
    const text=new Text('Ready to measure',{fontSize:0.75,anchor:CENTER,fill:hex('#38bdf8')});
    this.add(text);
    const bounds=text.getBoundingBox();
    const underline=new Line([[bounds.min.x,bounds.min.y-0.2],[bounds.max.x,bounds.min.y-0.2]],{stroke:hex('#f59e0b'),strokeWidth:0.045});
    this.add(underline);this.camera.frame([text,underline],{padding:0.4});await this.wait(3200);
  }
}
