import { Scene, Circle, Rect, SDFText, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

export default class AnimationControlWorkshop extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.camera.orthoScale = 7;
    new InteractionManager(this);
    const track = new Rect(6.6, 1.6, { stroke: hex('#64748b'), strokeWidth: 0.04 });
    const dot = new Circle(0.45, { fill: hex('#38bdf8') }); dot.move([-2.6, 0, 0]);
    const stop = new Circle(0.35, { fill: hex('#f59e0b') }); stop.move([0, -2, 0]);
    const label = new SDFText('Click the track to pause | amber to stop', { fontSize: 0.31, anchor: CENTER, fill: hex('#e2e8f0') });
    label.move([0, 2.2, 0]); this.add(track, dot, stop, label);
    const motion = dot.animate.move([2.6, 0, 0]);
    let paused = false, stopped = false;
    track.setEvent('click', () => { if (stopped) return; paused = !paused; if (paused) motion.pause(); else motion.resume(); this.invalidate(); });
    stop.setEvent('click', () => { stopped = true; motion.stop(); this.invalidate(); });
    await this.play(motion, { duration: 10000 });
    label.setText(stopped ? 'Stopped at its current position' : 'The play promise completed');
    this.invalidate();
  }
}
