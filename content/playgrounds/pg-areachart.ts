import { Scene, CameraModel, hex } from 'retiam';
import { AreaChart, DarkModernTheme } from 'retiam/charts';

/** One numeric series becomes one filled AreaChart. */
export default class AreaChartExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);

    const chart = new AreaChart({
      width: 9,
      height: 5,
      theme: DarkModernTheme,
      showTooltip: false,
      fillOpacity: 0.32,
      xRange: [0, 4],
      yRange: [0, 6],
      series: [{ color: hex('#38bdf8'), data: [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 5 }, { x: 4, y: 4 }] }],
    });
    this.add(chart);
    this.camera.frame(chart, { padding: 0.28 });
    await this.wait(3600);
  }
}
