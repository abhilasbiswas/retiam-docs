import { Scene, CameraModel, hex } from 'retiam';
import { BarChart, DarkModernTheme } from 'retiam/charts';

/** BarChart.animateIn reveals one existing chart from its baseline. */
export default class BarChartAnimateInExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 11;

    const chart = new BarChart({
      width: 9,
      height: 5.5,
      showCard: false,
      showValues: true,
      theme: DarkModernTheme,
      yRange: [0, 8],
      data: [
        { category: 'A', value: 2 },
        { category: 'B', value: 5 },
        { category: 'C', value: 3 },
      ],
    });
    this.add(chart);
    await this.play(chart.animateIn({ duration: 400 }));
    await this.wait(2000);
  }
}
