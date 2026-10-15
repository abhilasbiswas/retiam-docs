import { Scene, CameraModel, hex } from 'retiam';
import { BarChart, DarkModernTheme } from 'retiam/charts';

/** BarChart.animateData changes only the values of one existing chart. */
export default class BarChartDataExample extends Scene {
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
        { category: 'B', value: 4 },
        { category: 'C', value: 3 },
      ],
    });
    this.add(chart);
    await this.wait(500);
    await this.play(chart.animateData([
      { category: 'A', value: 6 },
      { category: 'B', value: 3 },
      { category: 'C', value: 7 },
    ], { duration: 1500 }));
    await this.wait(1000);
  }
}
