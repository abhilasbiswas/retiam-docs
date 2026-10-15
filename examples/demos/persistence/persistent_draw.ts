import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, Model, Math3D, Color, Circle, OrbitCameraController, Sprite, RenderTarget } from "retiam";

export default class PersistentDrawShowcase extends Scene {
    public async run() {
        if (this.composer)
            this.composer.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 0, 15]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Persistent drawing", "Two moving brushes accumulate in one render target");

        // 1. CREATE THE PERSISTENT RENDER TARGET (Physics3D-style clean init)
        const renderTarget = new RenderTarget(this, {
            width: 1024,
            height: 1024,
            type: "persistent",
            clearColor: new Color(0.02, 0.05, 0.1, 1.0),
            camera: 'scene'
        });

        // 2. CREATE THE PAINTBRUSH & ADD IT DIRECTLY (Physics3D-style add)
        const brush = new Circle(0.2);
        brush.paint.fill = new Color(0.2, 0.9, 0.6, 1.0);
        renderTarget.add(brush);

        this.always(() => {
            const t = this.time * 0.002;
            const x = Math.sin(t) * 6;
            const y = Math.sin(t * 2) * 6;

            brush.transform.position.set([x, y, 0]);

            brush.paint.fill.r = (Math.sin(t * 0.5) * 0.5 + 0.5);
            brush.paint.fill.b = (Math.cos(t * 0.5) * 0.5 + 0.5);
        });

        // ---------------------------------------------------------
        // 3. BUILD A PROPER 3D TV (Layer 0)
        // ---------------------------------------------------------

        // A. The TV Casing (A solid 3D Box)
        // Base size 6 means the local bounds go from -3 to +3
        const tvCasing = new Model(Math3D.createCube(6));
        tvCasing.transform.setScale([1.0, 1.0, 0.05]); // Squish it flat into a panel
        tvCasing.material.color = new Color(0.1, 0.1, 0.1, 1.0).rgba;
        tvCasing.material.roughness = 0.8;

        // B. The TV Screen (Generic Sprite created directly from RenderTarget)
        const tvScreen = renderTarget.toSprite(6, 6);

        // Place it exactly on the front face (Z=3) plus a tiny margin
        tvScreen.transform.position.z = 3.05;

        // Scale it down slightly in its own local space to create a TV "Bezel" border
        tvScreen.transform.setScale([0.9, 0.9, 1.0]);

        // C. Attach the Screen to the Casing
        tvCasing.add(tvScreen);
        this.add(tvCasing);

        // Spin the parent TV Casing (the 2D Sprite will follow it in 3D space perfectly!)
        // this.always(() => {
        //     tvCasing.transform.rotateWorldY(this.dt * 0.001);
        //     tvCasing.transform.rotateWorldX(this.dt * 0.0005);
        //     this.invalidate();
        // });
    }
}
