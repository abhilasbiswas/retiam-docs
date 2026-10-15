import { CENTER, Scene, Color, Text, CameraController, SDFText, Vec3, Write, Rate, Sphere, Torus, MorphModel, MorphMode, TracePath, CustomAnimation } from "retiam";
import { demoBackground } from "../../shared/presentation";


export default class ShowcaseScene extends Scene {
    public async run() {
        // 1. Scene Setup
        this.clearColor(demoBackground()); // Deep cinematic blue/black
        this.camera.position.set([0, 3, 25]);
        this.camera.pitch = -0.1;
        new CameraController(this, this.camera); // Allow user to look around

        // 2. Cinematic Title Intro
        const title = new SDFText("RETIAM ENGINE", { anchor: CENTER, fontSize: 1 });
        title.paint.fill = new Color(1.0, 1.0, 1.0, 1.0);
        title.transform.position = new Vec3(0, 2, 0); // Start slightly high
        title.center(); // Center mathematically

        // Write the text in beautifully
        await this.play(new Write(title, { duration: 2500, strokeWidth: 0.01, lagRatio: 0.1 }));
        await this.wait(1000);

        // Float title up and fade out
        this.play(title.animate.shift([0, 5, 0]).setOpacity(0), { duration: 1500, rate_func: Rate.easeInCubic() });

        // 3. Create our 3D Morph Targets
        const sphere = new Sphere(5, { widthSegments: 64, heightSegments: 64 });
        sphere.material.color = new Color(0.1, 0.6, 1.0, 1.0);
        sphere.material.roughness = 0.05;
        sphere.material.transmission = 0.8;
        sphere.material.ior = 1.45;

        const torus = new Torus(5, 2, { radialSegments: 64, tubularSegments: 64 });
        torus.material.color = new Color(1.0, 0.8, 0.2, 1.0);
        torus.material.emColor = new Color(1.0, 0.5, 0.0, 1.0);
        torus.material.emStrength = 1.5;
        torus.material.metallic = 1.0;
        torus.material.roughness = 0.2;

        const morph = new MorphModel(sphere, torus, {
            mode: MorphMode.SWARM,
            particleCount: 80000,
            particleSize: 0.12,
            noiseStrength: 15.0,
            noiseFrequency: 1.5,
            blendThreshold: 0.2
        });

        morph.transform.setScale(0.001);
        morph.material.opacity = 0;

        // FIX: Add ALL of them to the scene! MorphModel will automatically
        // manage their opacities to hide/show them at the perfect times.
        this.add(sphere, torus, morph);

        await this.play(morph.animate.setScale(1).setOpacity(1), { duration: 1500 });

        const comet = new TracePath({
            maxAge: 1500,
            fadeLength: 0.85,
            smoothing: 3,
            targetFunc: () => {
                const t = this.time * 0.002;
                return new Vec3(Math.cos(t * 1.5) * 12, Math.sin(t * 2.0) * 8, Math.sin(t * 1.0) * 12);
            }
        });
        comet.paint.stroke = new Color(0.0, 1.0, 0.8, 1.0);
        comet.paint.strokeWidth = 1.5;
        this.add(comet);

        this.always(() => {
            // Apply rotation to all 3 objects so they stay aligned!
            const rotY = this.dt * 0.0003;
            morph.transform.rotateWorldY(rotY);
            sphere.transform.rotateWorldY(rotY);
            torus.transform.rotateWorldY(rotY);
            this.invalidate();
        });

        await this.wait(1000);

        const morphAnim = new CustomAnimation((t) => {
            morph.setWeight(t);
        }, { duration: 6000, rate_func: Rate.easeInOutCubic() });
        this.addAnim(morphAnim);

        await this.wait(2500);

        console.log("Bullet Time: ON");
        await this.animateTimeScale(0.02, 800);

        await this.wait(80);

        console.log("Bullet Time: OFF");
        await this.animateTimeScale(1.0, 1000);

        await this.wait(3000);

        // 7. Grand Finale
        this.play(comet.animate.setOpacity(0), { duration: 1000 });

        // FIX: Scale to 0.001 to prevent NaN hardware crashes!
        // Also animate the Torus, since it is the one currently visible!
        this.play(morph.animate.setScale(0.001).setOpacity(0), { duration: 1500, rate_func: Rate.easeInCubic() });
        await this.play(torus.animate.setScale(0.001).setOpacity(0), { duration: 1500, rate_func: Rate.easeInCubic() });

        // Clean up
        morph.VISIBILITY = false;
        torus.VISIBILITY = false;
    }
}
