import { CameraModel, Scene, hex } from 'retiam';
import { BarChart, PieChart, LinearScale, BandScale, DarkModernTheme, CyberNeonTheme, LightModernTheme } from 'retiam/charts';

/** Three values divide one whole into labeled proportions. */
export default class ChartPieScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const chart = new PieChart({width: 8, height: 5, showCard: false, theme: DarkModernTheme, outerRadius: 2, innerRadius: 0, data: [{label:'A',value:50},{label:'B',value:30},{label:'C',value:20}]});
    this.add(chart); this.camera.frame(chart, {padding: 0.3});
    await this.play(chart.animateIn({duration: 1400})); await this.wait(1800);
  }
}
