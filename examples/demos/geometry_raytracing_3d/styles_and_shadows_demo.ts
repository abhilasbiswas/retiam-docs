// =========================================================================
// File: examples/demos/geometry_raytracing_3d/styles_and_shadows_demo.ts
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
    ShadingStyle,
    ShadowMethod
} from "retiam";
import { demoBackground, frameContent } from "../../shared/presentation";

export default class StylesAndShadowsScene extends Scene {
    public async run() {
        // 1. Camera & Scene Lighting Configuration
        this.camera.position.set([0, 16, 65]);
        new CameraController(this, this.camera);

        // Directional Key Light & Soft Studio Environment
        this.light.position.set([40, 60, 50]);
        this.light.color.set([1.0, 0.98, 0.95, 1.0]);
        this.env.skyColor.set([0.2, 0.24, 0.32]);
        this.env.groundColor.set([0.06, 0.07, 0.1]);
        this.env.intensity = 1.3;

        // Enable accurate Percentage-Closer Soft Shadows (PCSS) with contact hardening
        this.renderConfig.shadowsEnabled = true;
        this.renderConfig.shadowMethod = ShadowMethod.PCSS;
        this.renderConfig.lightSize = 3.2; // Soft penumbra that hardens at contact

        // Background studio color
        this.clearColor(demoBackground());

        // 2. 3D Scene Title
        const title = new Text("3D Art Styles & Accurate Contact Shadows (PCSS)", { anchor: CENTER,
            fontSize: 2.8,
            fill: new Color(0.92, 0.95, 1.0, 1.0)
        });
        title.transform.position = new Vec3(0, 22, -8);
        this.add(title);

        const subtitle = new Text("Real-Time Explanation Video Rendering Pipeline", { anchor: CENTER,
            fontSize: 1.6,
            fill: new Color(0.5, 0.65, 0.85, 1.0)
        });
        subtitle.transform.position = new Vec3(0, 18, -8);
        this.add(subtitle);

        // 3. Ground Plane (Receiver of contact-hardened shadows)
        const ground = new Plane(180, 180);
        ground.transform.position = [0, -10, 0];
        ground.material.color = new Color(0.38, 0.40, 0.44, 1.0);
        ground.material.roughness = 0.8;
        ground.material.metallic = 0.0;
        this.add(ground);

        // 4. Object 1: Standard PBR (Physically-Based Rendering)
        const pbrBox = new Box(10, 10, 10);
        pbrBox.transform.position = new Vec3(-30, 0, 0);
        pbrBox.material.shadingStyle = ShadingStyle.PBR;
        pbrBox.material.color = new Color(0.95, 0.75, 0.35, 1.0); // Polished Brass
        pbrBox.material.metallic = 0.85;
        pbrBox.material.roughness = 0.18;
        this.add(pbrBox);

        const lblPbr = new Text("1. Standard PBR", { anchor: CENTER, fontSize: 1.8, fill: new Color(0.95, 0.75, 0.35, 1.0) });
        lblPbr.transform.position = new Vec3(-30, -8, 8);
        this.add(lblPbr);

        // 5. Object 2: Gooch Shading (Technical Illustration / CAD Warm-Cool)
        const goochModel = new Sphere(6.5, { widthSegments: 48, heightSegments: 48 });
        goochModel.transform.position = new Vec3(-10, 0, 0);
        goochModel.material.setGooch(0.55, 0.55); // Warm-cool illustration
        goochModel.material.color = new Color(0.2, 0.65, 0.9, 1.0);
        this.add(goochModel);

        const lblGooch = new Text("2. Gooch CAD", { anchor: CENTER, fontSize: 1.8, fill: new Color(0.3, 0.75, 1.0, 1.0) });
        lblGooch.transform.position = new Vec3(-10, -8, 8);
        this.add(lblGooch);

        // 6. Object 3: Cel / Toon Shading (Quantized Step Bands + Fresnel Rim Glow)
        const celTorus = new Torus(6, 2.5, { radialSegments: 32, tubularSegments: 64 });
        celTorus.transform.position = new Vec3(10, 0, 0);
        celTorus.material.setCel(3.0, 0.75); // 3 discrete lighting steps + strong rim
        celTorus.material.color = new Color(0.95, 0.25, 0.4, 1.0); // Vibrant crimson
        this.add(celTorus);

        const lblCel = new Text("3. Cel / Toon", { anchor: CENTER, fontSize: 1.8, fill: new Color(1.0, 0.35, 0.5, 1.0) });
        lblCel.transform.position = new Vec3(10, -8, 8);
        this.add(lblCel);

        // 7. Object 4: Studio Clay (Minimalist Apple/Blender Matte Studio)
        const claySphere = new Sphere(6.5, { widthSegments: 48, heightSegments: 48 });
        claySphere.transform.position = new Vec3(30, 0, 0);
        claySphere.material.shadingStyle = ShadingStyle.CLAY;
        claySphere.material.color = new Color(0.85, 0.84, 0.82, 1.0);
        this.add(claySphere);

        const lblClay = new Text("4. Studio Clay", { anchor: CENTER, fontSize: 1.8, fill: new Color(0.85, 0.85, 0.85, 1.0) });
        lblClay.transform.position = new Vec3(30, -8, 8);
        this.add(lblClay);

        // 8. Dynamic Animation Loop
        frameContent(this, [title, subtitle, pbrBox, goochModel, celTorus, claySphere,
            lblPbr, lblGooch, lblCel, lblClay], 0.2);
        this.always(() => {
            const rotSpeed = this.dt * 0.0008;

            // Rotate objects to show off lighting highlights & contact shadow dynamics
            pbrBox.transform.rotateWorldY(rotSpeed);
            pbrBox.transform.rotateWorldX(rotSpeed * 0.6);

            goochModel.transform.rotateWorldY(rotSpeed * 0.7);

            celTorus.transform.rotateWorldX(rotSpeed * 0.9);
            celTorus.transform.rotateWorldZ(rotSpeed * 0.5);

            // Subtle bobbing motion to highlight contact shadow hardening vs. softening
            const bob = Math.sin(this.time * 0.0015) * 3.0;
            pbrBox.transform.position.y = bob;
            claySphere.transform.position.y = -bob;

            this.invalidate();
        });
    }
}
