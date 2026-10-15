import { Scene, CameraModel, hex } from 'retiam';
import { BarChart, DarkModernTheme } from 'retiam/charts';

/** A single BarChart: category labels map directly to bar height. */
export default class BarChartExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 11;

    const chart = new BarChart({
      title: 'Build time',
      width: 10,
      height: 6,
      theme: DarkModernTheme,
      showValues: true,
      valueSuffix: 's',
      data: [
        { category: 'Parse', value: 2 },
        { category: 'Bundle', value: 5 },
        { category: 'Emit', value: 3 },
      ],
    });
    this.add(chart);
    this.camera.frame(chart, { padding: 0.28 });
    await this.wait(2600);
  }
}
