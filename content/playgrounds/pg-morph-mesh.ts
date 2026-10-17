import { MorphMode, SwarmTrajectory, Box, CameraModel, Morph, Scene, Sphere, hex } from 'retiam';

/** A small box morphs into a sphere through the Model morph contract. */
export default class MorphMeshScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const source = new Box(2.2,2.2,2.2, {shading: 'manim', color: hex('#38bdf8')});
    this.add(source); this.camera.frame(source, {padding: 0.6});
    await this.wait(700); await this.play(Morph(source,new Sphere(1.5, {shading: 'manim', color: hex('#f59e0b')}), {mode: MorphMode.SWARM, particleCount: 320, particleSize: 0.035, noiseStrength: 0, trajectory: SwarmTrajectory.LINEAR}), {duration: 2400});
    await this.wait(1200);
  }
}
