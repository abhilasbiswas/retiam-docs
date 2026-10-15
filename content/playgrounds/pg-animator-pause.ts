import { Scene, CameraModel, Circle, Rate, hex } from 'retiam';

/** One Animator pauses, holds its position, then resumes. */
export default class AnimatorPauseExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const dot = new Circle(0.35, { fill: hex('#38bdf8') }).move([-2.4, 0, 0]);
    this.add(dot);
    const motion = dot.animate.move([4.8, 0, 0]);
    let elapsed = 0;
    let phase = 0;
    const control = this.always((_time, dt) => {
      elapsed += dt;
      if (phase === 0 && elapsed >= 700) {
        motion.pause();
        phase = 1;
      } else if (phase === 1 && elapsed >= 1400) {
        motion.resume();
        phase = 2;
      }
    });
    await this.play(motion, { duration: 2600, rate_func: Rate.linear() });
    control.stop();
    await this.wait(600);
  }
}
