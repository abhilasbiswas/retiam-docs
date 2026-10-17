import { CameraModel, InteractionManager, Scene, hex } from 'retiam';
import { BarChart, PieChart, LinearScale, BandScale, DarkModernTheme, CyberNeonTheme, LightModernTheme } from 'retiam/charts';

/** A three-bar chart shows a value tooltip on hover. */
export default class ChartTooltipScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    new InteractionManager(this);
    const chart = new BarChart({width:8,height:5,showCard:false,theme:DarkModernTheme,showTooltip:true,yRange:[0,8],data:[{category:'A',value:2},{category:'B',value:6},{category:'C',value:4}]});
    this.add(chart);this.camera.frame(chart,{padding:0.4});await this.wait(6000);
  }
}
