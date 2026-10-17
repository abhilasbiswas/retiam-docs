import { CameraModel, CustomAnimation, Model, Scene, hex } from 'retiam';

/** The same indexed triangle changes its top vertex without changing topology. */
export default class MeshUpdateScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const positions = [-2,-1,0, 2,-1,0, 0,1,0];
    const triangle = new Model(positions, [0,1,2], undefined, {shading: 'manim', color: hex('#38bdf8')});
    this.add(triangle);
    await this.wait(800);
    await this.play(new CustomAnimation(t => {
     positions[7] = 1 + Math.sin(t * Math.PI) * 1.4;
     triangle.updateVertices(positions);
    }, {duration: 2400}));
    await this.wait(1000);
  }
}
