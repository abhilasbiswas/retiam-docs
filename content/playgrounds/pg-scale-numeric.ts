import { CENTER, CameraModel, CustomAnimation, Line, Rect, SDFText, Scene, hex } from 'retiam';
import { BarChart, PieChart, LinearScale, BandScale, DarkModernTheme, CyberNeonTheme, LightModernTheme } from 'retiam/charts';

/** A LinearScale maps a changing value from zero-to-ten into a visible bar height. */
export default class ScaleNumericScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const scale = new LinearScale([0,10],[0,3.5]);
    const bar = new Rect(1.2, 1, {fill:hex('#38bdf8')});
    const label = new SDFText('2', {fontSize:0.5,anchor:CENTER}).move([2,0,0]);
    this.add(bar,label,new Line([[-1,-1.75],[1,-1.75]],{stroke:hex('#334155'),strokeWidth:0.04}));
    await this.play(new CustomAnimation(t => {const value=2+6*t; const height=scale.scale(value); bar.setScale([1,height,1]);bar.move([0,-1.75+height/2,0]);label.setText(value.toFixed(1));},{duration:2600}));
    await this.wait(1200);
  }
}
