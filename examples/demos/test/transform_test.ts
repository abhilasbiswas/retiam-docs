import { CENTER } from "retiam";
import { frameStage } from "../../shared/presentation";
import { Scene, Color, Text, CameraController, SDFText, Vec3, Write, Rate, Sphere, Torus, MorphModel, MorphMode, TracePath, CustomAnimation, Circle, DOWN, FadeIn, Math3D, Model, Morph, Rect, RIGHT, SDFBox, SDFEntity3D, SDFSphere, Tex, TransformMatch, Triangle, Vec2, VGroup } from "retiam";

export default class UnifiedTransformTestScene extends Scene {

    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 180, 115);

        // =====================================================================
        // PART 1: TESTING THE `Morph` API
        // =====================================================================
        let title = new Text("Testing Morph API", { anchor: CENTER, fontSize: 3, fill: new Color(0.2, 0.8, 1.0, 1.0) });
        title.transform.position = new Vec3(0, 30, 0);
        await this.play(new FadeIn(title, { duration: 1000 }));

        // --- Test 1A: 2D Vector Morph (Circle -> Square) ---
        let subtitle = new Text("1. 2D VectorEntity Morph", { anchor: CENTER, fontSize: 2 });
        subtitle.nextTo(title, DOWN, 2);
        await this.play(new FadeIn(subtitle, { duration: 500 }));

        const circle = new Circle(8);
        circle.paint.fill = new Color(1.0, 0.2, 0.5, 1.0);
        circle.transform.position = new Vec3(-20, 0, 0);
        this.add(circle);

        await this.play(new Write(circle, { duration: 1000 }));

        const square = new Rect(16, 16);
        square.paint.fill = new Color(0.2, 1.0, 0.5, 1.0);
        square.transform.position = new Vec3(20, 0, 0);

        // Triggers VectorTransform
        await this.play(Morph(circle, square, { duration: 1500, rate_func: Rate.easeInOutCubic() }));
        await this.wait(500);
        this.remove(square, subtitle);

        // --- Test 1B: 3D Model Morph (Sphere -> Torus via Swarm) ---
        subtitle = new Text("2. 3D Model Morph (SWARM)", { anchor: CENTER, fontSize: 2 });
        subtitle.nextTo(title, DOWN, 2);
        this.add(subtitle);

        const sphereMesh = Math3D.computeSmoothShading(Math3D.createSphere(10, 32, 32).vertices, Math3D.createSphere(10, 32, 32).indices!);
        const modelA = new Model(sphereMesh);
        modelA.material.color = new Color(0.1, 0.5, 1.0, 1.0).rgba;
        modelA.transform.position = new Vec3(-20, 0, 0);
        this.add(modelA);

        const modelB = new Torus(8, 3, { radialSegments: 16, tubularSegments: 32 });
        modelB.material.color = new Color(1.0, 0.8, 0.1, 1.0).rgba;
        modelB.transform.position = new Vec3(20, 0, 0);

        // Rotate models dynamically during the morph
        this.always(() => {
            modelA.transform.rotateWorldY(this.dt * 0.001);
            modelB.transform.rotateWorldY(this.dt * 0.001);
        });

        // Triggers ModelTransform
        await this.play(Morph(modelA, modelB, {
            duration: 2500,
            mode: MorphMode.SWARM,
            particleCount: 40000,
            noiseStrength: 4.0
        }));
        await this.wait(500);
        this.remove(modelB, subtitle);

        // --- Test 1C: 3D SDF Volume Morph ---
        subtitle = new Text("3. 3D SDF Volume Morph", { anchor: CENTER, fontSize: 2 });
        subtitle.nextTo(title, DOWN, 2);
        this.add(subtitle);

        const sdfA = new SDFEntity3D(new SDFSphere(10));
        sdfA.material.color = new Color(0.8, 0.1, 1.0, 1.0).rgba;
        sdfA.transform.position = new Vec3(-20, 0, 0);
        this.add(sdfA);

        const sdfB = new SDFEntity3D(new SDFBox(16, 16, 16));
        sdfB.material.color = new Color(0.1, 1.0, 0.8, 1.0).rgba;
        sdfB.transform.position = new Vec3(20, 0, 0);

        // Triggers SDF3DTransform
        await this.play(Morph(sdfA, sdfB, { duration: 2000, rate_func: Rate.easeInOutSine() }));
        await this.wait(1000);
        this.remove(title, subtitle, sdfB);


        // =====================================================================
        // PART 2: TESTING THE `TransformMatch` API
        // =====================================================================
        title = new Text("Testing TransformMatch API", { anchor: CENTER, fontSize: 2, fill: new Color(1.0, 0.8, 0.2, 1.0) });
        title.transform.position = new Vec3(0, 30, 0);
        await this.play(new FadeIn(title, { duration: 1000 }));

        // --- Test 2A: Text Matching (Anagrams) ---
        subtitle = new Text("1. Strict Text Matching", { anchor: CENTER, fontSize: 2 });
        subtitle.nextTo(title, DOWN, 2);
        await this.play(new FadeIn(subtitle, { duration: 500 }));

        const text1 = new Text("LISTEN", { anchor: CENTER, fontSize: 4 });
        text1.paint.fill = new Color(0.2, 0.8, 1.0, 1.0);
        text1.center();

        await this.play(new Write(text1, { duration: 1500 }));
        await this.wait(500);

        const text2 = new Text("SILENT", { anchor: CENTER, fontSize: 4 });
        text2.paint.fill = new Color(1.0, 0.4, 0.4, 1.0);
        text2.center();

        // Triggers TransformMatching (Index-based character mapping)
        await this.play(TransformMatch(text1, text2, { duration: 2000, morphUnmatched: true }));
        await this.wait(1000);
        this.remove(text2, subtitle);

        // --- Test 2B: Tex Equation Matching ---
        subtitle = new Text("2. LaTeX Equation Matching", { anchor: CENTER, fontSize: 2 });
        subtitle.nextTo(title, DOWN, 2);
        this.add(subtitle);

        const tex1 = new Tex("a^2 + b^2 = c^2", { anchor: CENTER, fontSize: 4 });
        tex1.paint.fill = Color.WHITE;
        tex1.center();

        await this.play(new FadeIn(tex1, { duration: 1000 }));
        await this.wait(500);

        const tex2 = new Tex("c^2 = a^2 + b^2", { anchor: CENTER, fontSize: 4, fill: Color.RED });
        tex2.paint.fill = new Color(0.5, 1.0, 0.5, 1.0);
        tex2.center();

        // Triggers TransformMatchingTex (Spatial bounding box & MathJax symbol mapping)
        await this.play(TransformMatch(tex1, tex2, { duration: 2000 }));
        await this.wait(1000);
        this.remove(tex2, subtitle);

        // --- Test 2C: Generic VGroup / Shape Matching (Kabsch Algorithm) ---
        subtitle = new Text("3. Generic Shape Array Matching", { anchor: CENTER, fontSize: 2 });
        subtitle.nextTo(title, DOWN, 2);
        this.add(subtitle);

        const s1 = new Circle(4); s1.paint.fill = Color.RED;
        const s2 = new Rect(8, 8); s2.paint.fill = Color.BLUE;
        const s3 = new Triangle([new Vec2(0, 4), new Vec2(-4, -4), new Vec2(4, -4)], { fill: Color.GREEN });

        const group1 = new VGroup(s1, s2, s3).arrange(RIGHT, 4).center();
        await this.play(new FadeIn(group1, { duration: 1000 }));
        await this.wait(500);

        // Target state: Different order, different positions, different rotations, different scales
        const t1 = new Circle(4); t1.paint.fill = Color.RED;
        const t2 = new Rect(8, 8); t2.paint.fill = Color.BLUE;
        const t3 = new Triangle([new Vec2(0, 4), new Vec2(-4, -4), new Vec2(4, -4)], { fill: Color.GREEN });

        const group2 = new VGroup(t3, t1, t2).arrange(DOWN, 2).center(); // Scrambled array, vertical layout
        t1.transform.setScale(0.5);   // Scale it down
        t2.transform.rotateWorldZ(Math.PI / 4); // Rotate the square 45 degrees

        // Triggers TransformMatchingShapes (Procrustes/Kabsch rigid body alignment)
        await this.play(TransformMatch(group1, group2, { duration: 2500, rate_func: Rate.easeInOutBack() }));

        await this.wait(2000);
    }
}
