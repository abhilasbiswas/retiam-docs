// =========================================================================
// File: examples/demos/geometry_raytracing_3d/plugin_system_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    CameraController,
    Plane,
    Box,
    Torus,
    Sphere,
    Color,
    Vec3,
    Text,
    IPlugin,
    ShadowMethod,
    ShadingStyle
} from "retiam";
import { OutlinePlugin } from "retiam";
import { demoBackground, frameContent } from "../../shared/presentation";


/**
 * Clean User-Defined Plugin Example:
 * Demonstrates a custom procedural animation and camera rig plugin
 * implemented in just 15 lines of code without touching Retiam core!
 */
export class BobAndRotatePlugin implements IPlugin {
    public name = "BobAndRotatePlugin";

    constructor(public speedMultiplier: number = 1.0) {}

    public install(scene?: Scene): void {
        if (!scene) return;

        // Automatically instruments the scene animation loop
        scene.always(() => {
            const rot = scene.dt * 0.0008 * this.speedMultiplier;
            for (const entity of scene.entities) {
                if (entity instanceof Torus || entity instanceof Box || entity instanceof Sphere) {
                    entity.transform.rotateWorldY(rot * 0.7);
                }
            }
        });
    }
}

/**
 * Interactive Demo: Retiam Plugin Architecture
 * Demonstrates clean plugin composition via scene.use(...) and live toggles.
 */
export default class PluginSystemDemoScene extends Scene {
    private outlinePlugin!: OutlinePlugin;
    private isOutlineActive: boolean = false;

    public async run() {
        // 1. Camera & Studio Key Lighting Configuration
        this.camera.position.set([0, 16, 65]);
        new CameraController(this, this.camera);

        this.light.position.set([40, 60, 50]);
        this.light.color.set([1.0, 0.98, 0.95, 1.0]);
        this.env.skyColor.set([0.2, 0.24, 0.32]);
        this.env.groundColor.set([0.06, 0.07, 0.1]);
        this.env.intensity = 1.3;

        // Clean contact-hardened shadows (PCSS)
        this.renderConfig.shadowsEnabled = true;
        this.renderConfig.shadowMethod = ShadowMethod.PCSS;
        this.renderConfig.lightSize = 3.2;

        // Background studio color
        this.clearColor(demoBackground());

        // 2. 3D Scene Titles & Legend (Bright, crisp white text)
        const title = new Text("Retiam Plugin Architecture", { anchor: CENTER,
            fontSize: 2.8,
            fill: new Color(0.92, 0.95, 1.0, 1.0)
        });
        title.transform.position = new Vec3(0, 22, -8);
        this.add(title);

        const subtitle = new Text("Zero-Touch Extensibility: scene.use(new Plugin())", { anchor: CENTER,
            fontSize: 1.6,
            fill: new Color(0.5, 0.65, 0.85, 1.0)
        });
        subtitle.transform.position = new Vec3(0, 18, -8);
        this.add(subtitle);

        const statusLabel = new Text("Active: Cel Shading + BobAndRotatePlugin  |  Press [O] to Toggle Inking", { anchor: CENTER,
            fontSize: 1.4,
            fill: new Color(0.4, 0.9, 0.7, 1.0)
        });
        statusLabel.transform.position = new Vec3(0, -9.5, 12);
        this.add(statusLabel);

        // 3. Ground Plane
        const ground = new Plane(180, 180);
        ground.transform.position = [0, -10, 0];
        ground.material.color = new Color(0.38, 0.40, 0.44, 1.0);
        ground.material.roughness = 0.8;
        ground.material.metallic = 0.0;
        this.add(ground);

        // 4. 3D Objects Showcasing Styles
        // Object A: Crimson Torus (Cel Shading)
        const celTorus = new Torus(6, 2.5, { radialSegments: 32, tubularSegments: 64 });
        celTorus.transform.position = new Vec3(-22, 1, 0);
        celTorus.material.shadingStyle = ShadingStyle.CEL;
        celTorus.material.color = new Color(0.95, 0.25, 0.4, 1.0);
        this.add(celTorus);

        const lblCel = new Text("Cel Shading", { anchor: CENTER, fontSize: 1.6, fill: new Color(1.0, 0.4, 0.5, 1.0) });
        lblCel.transform.position = new Vec3(-22, -6, 8);
        this.add(lblCel);

        // Object B: Gooch Technical CAD Sphere
        const goochSphere = new Sphere(6.5, { widthSegments: 48, heightSegments: 48 });
        goochSphere.transform.position = new Vec3(0, 1, 0);
        goochSphere.material.shadingStyle = ShadingStyle.GOOCH;
        goochSphere.material.color = new Color(0.2, 0.65, 0.9, 1.0);
        this.add(goochSphere);

        const lblGooch = new Text("Gooch Shading (CAD)", { anchor: CENTER, fontSize: 1.6, fill: new Color(0.3, 0.75, 1.0, 1.0) });
        lblGooch.transform.position = new Vec3(0, -6, 8);
        this.add(lblGooch);

        // Object C: Brass Box (Standard PBR)
        const pbrBox = new Box(10, 10, 10);
        pbrBox.transform.position = new Vec3(22, 1, 0);
        pbrBox.material.shadingStyle = ShadingStyle.PBR;
        pbrBox.material.color = new Color(0.95, 0.75, 0.35, 1.0);
        pbrBox.material.metallic = 0.85;
        pbrBox.material.roughness = 0.2;
        this.add(pbrBox);

        const lblPbr = new Text("PBR Brass Box", { anchor: CENTER, fontSize: 1.6, fill: new Color(0.95, 0.8, 0.4, 1.0) });
        lblPbr.transform.position = new Vec3(22, -6, 8);
        this.add(lblPbr);

        // =====================================================================
        // 5. PLUGINS — only real plugins, not config wrappers
        // =====================================================================
        // Cel/Gooch are set directly on material.shadingStyle — no plugin needed!
        // Only BobAndRotate is a real plugin (it instruments the scene loop).
        this.use(new BobAndRotatePlugin(1.2));

        // Prepare OutlinePlugin for live interactive toggling
        this.outlinePlugin = new OutlinePlugin({ thickness: 1.0, threshold: 0.55 });

        // 6. Interactive Keyboard Toggle for Inking
        window.addEventListener("keydown", (e) => {
            if (e.key === "o" || e.key === "O") {
                this.isOutlineActive = !this.isOutlineActive;
                if (this.isOutlineActive) {
                    this.use(this.outlinePlugin);
                    statusLabel.text = "Active: Cel + BobAndRotate + OutlinePlugin [INKING ON]";
                } else {
                    this.removePlugin("OutlinePlugin");
                    statusLabel.text = "Active: Cel + BobAndRotate [Press O to Toggle Inking]";
                }
                this.invalidate();
            }
        });

        // 7. Dynamic Animation Loop
        frameContent(this, [title, subtitle, statusLabel, celTorus, goochSphere, pbrBox,
            lblCel, lblGooch, lblPbr], 0.2);
        this.always(() => {
            // Subtle bobbing motion
            const bob = Math.sin(this.time * 0.0018) * 2.5;
            celTorus.transform.position.y = 1 + bob;
            pbrBox.transform.position.y = 1 - bob;
            this.invalidate();
        });
    }
}
