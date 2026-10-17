import { CENTER, CameraModel, RTVideo, SDFText, Scene, hex } from 'retiam';

/** A local video plays as geometry while a visible clock follows scene time. */
export default class VideoTimelineScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const video = new RTVideo(6.4, 3.6);
    await video.load('/res/media/nature.mp4');
    const clock = new SDFText('0.0 s', {fontSize: 0.4, anchor: CENTER}).move([0, -2.4, 0]);
    this.add(video, clock); video.play();
    this.always(time => clock.setText((time / 1000).toFixed(1) + ' s'), {interval: 100});
    await this.wait(4200); video.pause();
    await this.wait(1000);
  }
}
