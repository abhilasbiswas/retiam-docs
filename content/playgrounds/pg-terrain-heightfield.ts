import { CameraModel, Scene, Terrain3D, hex } from 'retiam';

/** A small procedural terrain uses a bounded sixteen-by-sixteen elevation grid. */
export default class TerrainHeightfieldScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const terrain = new Terrain3D({width: 5, height: 5, depthScale: 0.7, widthSegments: 16, heightSegments: 16, shading: 'manim', color: hex('#38bdf8')});
    await terrain.generateFromHeightmap(this, '/res/media/docs/heightmap.png');
    this.add(terrain); this.camera.lookAt([0,0,0]);
    await this.wait(3200);
  }
}
