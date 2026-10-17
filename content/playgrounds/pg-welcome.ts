import { Scene, CameraModel, SDFText, Path, Circle, Create, Write, FadeIn, CustomAnimation, Rate, Color, CENTER, hex } from 'retiam';

/** A quiet welcome: a word is written, a curve is drawn, and a point follows it. */
export default class WelcomeScene extends Scene {
  async run() {
    this.disablePlayer();
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);

    const title = new SDFText('Retiam', { fontSize: 1.1, anchor: CENTER, fill: hex('#f8fafc') }).move([0, 1.5, 0]);
    const caption = new SDFText('Ideas, in motion.', { fontSize: 0.34, anchor: CENTER, fill: hex('#94a3b8') }).move([0, 0.65, 0]);
    const curve = new Path('M -3 -1.3 Q 0 0.8 3 -1.3', { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.045 });
    const dot = new Circle(0.12, { fill: hex('#f59e0b'), stroke: Color.NONE }).move([-3, -1.3, 0]);
    this.add(title, caption, curve, dot);
    this.camera.frame([title, caption, curve, dot], { padding: 0.45 });

    await this.play(new Write(title), { duration: 1200 });
    await this.play(new FadeIn(caption), new Create(curve), new FadeIn(dot), { duration: 900 });
    await this.play(new CustomAnimation(t => {
      dot.move([-3 + 6 * t, -1.3 + 4.2 * t * (1 - t), 0]);
    }), { duration: 2400, rate_func: Rate.easeInOutCubic() });
    await this.wait(800);
    await this.play(new CustomAnimation(t => {
      const u = 1 - t;
      dot.move([-3 + 6 * u, -1.3 + 4.2 * u * (1 - u), 0]);
    }), { duration: 2400, rate_func: Rate.easeInOutCubic() });
    await this.wait(1800);
  }
}
