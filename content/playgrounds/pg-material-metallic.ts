import { CameraModel, Scene, Sphere, hex } from 'retiam';

/** Two spheres differ only in metallic. */
export default class MaterialMetallicScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const left = new Sphere(1.05), right = new Sphere(1.05);
    left.move([-1.5,0,0]); right.move([1.5,0,0]);
    for (const shape of [left,right]) {shape.material.color = hex('#38bdf8'); shape.material.roughness = 0.25; shape.material.emColor = hex('#38bdf8');}
    left.material.metallic = 0; right.material.metallic = 1;
    this.add(left,right);
    this.camera.frame([left,right], {padding: 0.4});
    await this.wait(3400);
  }
}
