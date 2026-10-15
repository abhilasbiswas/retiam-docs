import { Scene, CameraModel, hex } from 'retiam';
import { BarChart, DarkModernTheme } from 'retiam/charts';

export default class ChartProject extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 13; this.camera.position.set([0, 0, 20]);
    const data = [
      { category: 'Build', value: 42 },
      { category: 'Test', value: 68 },
      { category: 'Ship', value: 55 },
    ];
    const chart = new BarChart({
      title: 'Pipeline time', width: 12, height: 7,
      showCard: false,
      theme: { ...DarkModernTheme, colors: [hex('#38bdf8'), hex('#38bdf8'), hex('#f59e0b')], fontSize: 0.5, titleFontSize: 0.7 },
      yRange: [0, 100], showValues: true, data,
    });
    this.add(chart);
  }
}
