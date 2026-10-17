import { CameraModel, Circle, Rect, Scene, hex } from 'retiam';

/** Two independently scripted scenes share the existing composer; their scene alpha values crossfade. */
export default class ComposerCrossfadeScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    class CircleChapter extends Scene {
      async run() {
        const mark = new Circle(1.25, {fill: hex('#38bdf8')}); this.add(mark);
        await this.play(mark.animate.shift([-0.8, 0, 0]), {duration: 1200});
      }
    }
    class SquareChapter extends Scene {
      async run() {
        const mark = new Rect(2.2, 2.2, {fill: hex('#f59e0b')}); this.add(mark);
        await this.play(mark.animate.rotate(Math.PI / 4), {duration: 1200});
      }
    }
    const composer = this.composer!;
    const first = new CircleChapter(), second = new SquareChapter();
    composer.add(first, {zIndex: 1}); composer.add(second, {zIndex: 2});
    second.ALPHA = 0;
    const scripts = Promise.all([first.run(), second.run()]);
    await this.wait(1500);
    await this.play(first.fadeTo(0, 1400), second.fadeTo(1, 1400));
    await scripts;
    await this.wait(1000);
    composer.remove(first); first.destroy();
    composer.remove(second); second.destroy();
  }
}
