import { Box, CameraModel, OutlinePlugin, Scene, hex } from 'retiam';

/** A Sobel outline is installed, removed, and installed again around one box. */
export default class PluginOutlineScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const box=new Box(2,2,2,{shading:'manim',color:hex('#38bdf8')});this.add(box);this.camera.frame(box,{padding:0.4});
    await this.wait(800);this.use(new OutlinePlugin({color:hex('#f59e0b'),thickness:2}));
    await this.wait(1200);this.removePlugin('OutlinePlugin');
    await this.wait(1000);this.use(new OutlinePlugin({color:hex('#f59e0b'),thickness:2}));
    await this.wait(1400);
  }
}
