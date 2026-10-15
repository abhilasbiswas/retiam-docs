import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
// =============================================================================
// RenderTarget Demo: type = "offscreen"
// USE CASE: Minimap, security camera, picture-in-picture, render-to-texture
//
// Offscreen renders a scene snapshot every frame using its own dedicated
// orthographic camera. The result is cleared each frame (no accumulation).
// =============================================================================
import { Scene, Model, Math3D, Color, Circle, Rect, OrbitCameraController, Sprite, RenderTarget, CameraModel, Camera, SDFText, Vec3 } from "retiam";

export default class OffscreenDemo extends Scene {
    public async run() {
        // --- Main 3D Camera ---
        this.camera.position.set([0, 5, 20]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "An offscreen render target", "A miniature scene becomes a live display");

        // --- 1. CREATE OFFSCREEN RENDER TARGET ---
        // Default: orthographic camera, cleared every frame
        const minimap = new RenderTarget(this, "Minimap", {
            width: 512,
            height: 512,
            type: "offscreen"
        });

        // --- 2. CREATE OBJECTS CAPTURED INTO OFFSCREEN ---
        // These objects render ONLY into the offscreen texture (hidden from main camera)
        const dot = new Circle(20);
        dot.paint.fill = new Color(1.0, 0.3, 0.4, 1.0);

        const trail1 = new Circle(8);
        trail1.paint.fill = new Color(0.2, 0.8, 1.0, 0.8);

        const trail2 = new Circle(8);
        trail2.paint.fill = new Color(0.8, 1.0, 0.2, 0.8);

        const border = new Rect(480, 480);
        border.paint.fill = Color.NONE;
        border.paint.stroke = new Color(0.3, 0.7, 1.0, 0.6);
        border.paint.strokeWidth = 2;

        minimap.capture(dot, trail1, trail2, border);

        // --- 3. ANIMATE THE CAPTURED OBJECTS ---
        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        this.always(() => {
            const t = this.time * 0.002;
            // Main dot follows a Lissajous curve
            dot.transform.position.set([Math.sin(t * 1.5) * 200, Math.cos(t) * 200, 0]);
            // Trailing dots orbit at different phases
            trail1.transform.position.set([Math.sin(t * 1.5 + 1) * 150, Math.cos(t + 1) * 150, 0]);
            trail2.transform.position.set([Math.sin(t * 1.5 + 2) * 100, Math.cos(t + 2) * 100, 0]);

            // Dynamic color
            dot.paint.fill.g = Math.sin(t) * 0.5 + 0.5;
        });

        // --- 4. BUILD 3D SCENE (visible to main camera) ---

        // Rotating 3D cube
        const cube = new Model(Math3D.createCube(4));
        cube.material.color = new Color(0.15, 0.15, 0.2, 1.0).rgba;
        cube.material.roughness = 0.4;
        cube.transform.position.set([-6, 3, 0]);
        this.add(cube);

        // Ground plane
        const ground = new Model(Math3D.createCube(30));
        ground.transform.setScale([1, 0.02, 1]);
        ground.material.color = new Color(0.08, 0.08, 0.12, 1.0).rgba;
        this.add(ground);

        // TV displaying the minimap texture
        const tvCasing = new Model(Math3D.createCube(8));
        tvCasing.transform.setScale([1.0, 0.75, 0.04]);
        tvCasing.transform.position.set([0, 4, -5]);
        tvCasing.material.color = new Color(0.05, 0.05, 0.08, 1.0).rgba;
        tvCasing.material.roughness = 0.9;

        const tvScreen = new Sprite(7.2, 5.4, minimap.texture!);
        tvScreen.transform.position.z = 4.05;

        tvCasing.add(tvScreen);
        this.add(tvCasing);

        // Animate the cube
        this.always(() => {
            cube.transform.rotateWorldY(this.dt * 0.001);
            cube.transform.rotateWorldX(this.dt * 0.0005);
        });
    }
}
