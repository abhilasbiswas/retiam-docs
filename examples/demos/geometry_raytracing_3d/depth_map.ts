import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { CameraController, Color, OrbitCameraController, Scene, Terrain3D, Vec2, Vec3, light } from "retiam";


export default class WelcomeScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        // Setup Camera: Position high up, look DOWN at the terrain
        this.camera.position.set([0, 75, 145]);
        this.camera.pitch = -0.5; // Look down
        new OrbitCameraController(this, this.camera, { radius: 180 });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "A procedural terrain", "Depth and surface shading across the height field");

        // 1. Initialize Terrain Geometry Settings
        const terrain = new Terrain3D({
            width: 100,
            height: 100,
            depthScale: 10,
            widthSegments: 64,
            heightSegments: 64
        });

        // 2. Await generation (Will fallback to procedural waves if image fails)
        await terrain.generateFromHeightmap(this, '/res/media/depth.png');

        // 3. Print the GPU calculation results to the browser console!

        // 4. Paint the terrain using standard PBR Model properties
        terrain.material.color = new Color(0.05,0.3,0.2,1.0);
        // terrain.material.roughness = 0.8;

        // Add a slight glow so it's guaranteed to be visible even if the light misses it
        // terrain.material.emColor = new Color(0.15, 0.7, 0.35, 1.0);
        // terrain.material.emStrength = 0.25;
        terrain.setTextureMap("/res/media/checker.png")

        // Adjust engine global light
        // light.position.set([-50, 100, 50]);

        this.add(terrain);

        // Slowly spin it around!
        // this.always(() => {
        //     terrain.transform.rotateWorldY(this.dt * 0.0002);
        //     this.invalidate();
        // });
    }
}
