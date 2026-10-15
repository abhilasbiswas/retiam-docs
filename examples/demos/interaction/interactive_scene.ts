import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene,
    InteractionManager,
    CameraController,
    Text,
    Plane,
    Color,
    Box,
    Sphere,
    Torus,
    Vec3,
    Circle,
    Rect,
    Triangle,
    Path,
    Tex,
    SDFText,
    ModelGeometry
} from "retiam";

export default class MultiInteractivityScene extends Scene {
    private sceneModels: any[] = [];

    public async run() {
        // 1. Establish Camera & Interactions
        this.camera.position.set([0, 5, 55]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "An interactive scene", "Drag the geometry and typography to explore hit testing");
        this.interactionManager = new InteractionManager(this);

        // 2. Set Up Ground and Ambient Lighting
        const ground = new Plane(150, 150);
        ground.transform.position = [0, -15, 0];
        ground.material.color = new Color(0.12, 0.12, 0.15, 1.0);
        ground.material.roughness = 0.9;
        this.add(ground);

        // =====================================================================
        // SECTION A: Interactive 3D Primitives (Background row)
        // =====================================================================
        const box3D = new Box(6, 6, 6);
        const sphere3D = new Sphere(4, { widthSegments: 32, heightSegments: 32 });
        const torus3D = new Torus(5, 1.5, { radialSegments: 16, tubularSegments: 32 });

        const config3D = [
            { model: box3D, pos: new Vec3(-18, -4, -10), col: new Color(0.9, 0.1, 0.1, 1), em: new Color(0.8, 0, 0, 1) },
            { model: sphere3D, pos: new Vec3(0, -4, -10), col: new Color(0.1, 0.8, 1, 1), em: new Color(0, 0.7, 1, 1) },
            { model: torus3D, pos: new Vec3(18, -4, -10), col: new Color(0.9, 0.1, 0.9, 1), em: new Color(0.7, 0, 0.7, 1) }
        ];

        config3D.forEach(({ model, pos, col, em }) => {
            model.transform.position = pos;
            model.material.color = col;
            model.material.emColor = em;
            model.material.emStrength = 0.5;
            model.material.roughness = 0.2;
            this.add(model);
            this.sceneModels.push(model);

            this.bindBasicCallbacks(model, col, false);
        });

        // =====================================================================
        // SECTION B: Interactive 2D Primitive Shapes
        // =====================================================================
        const circle2D = new Circle(4);
        const rect2D = new Rect(8, 5);
        const tri2D = new Triangle([[-4, -3], [4, -3], [0, 5]]);

        const config2D = [
            { model: circle2D, pos: new Vec3(-22, 12, 5), col: new Color(0, 0.9, 0.3, 1.0) },
            { model: rect2D, pos: new Vec3(-12, 12, 5), col: new Color(0.95, 0.45, 0, 1.0) },
            { model: tri2D, pos: new Vec3(-2, 12, 5), col: new Color(1, 0.85, 0, 1.0) }
        ];

        config2D.forEach(({ model, pos, col }) => {
            model.transform.position = pos;
            model.paint.fill = col;
            model.paint.stroke = new Color(1, 1, 1, 1);
            model.paint.strokeWidth = 1.0;
            this.add(model);
            this.sceneModels.push(model);

            this.bindBasicCallbacks(model, col, true);
        });

        // =====================================================================
        // SECTION C: Interactive SVG and Typographic Elements
        // =====================================================================

        // 1. GPU SVG Path (Heart shape SVG vector)
        const svgHeart = new Path("M 0 -3 C -5 -12 -12 -12 -12 -5 C -12 3 -5 8 0 15 C 5 8 12 3 12 -5 C 12 -12 5 -12 0 -3 Z");
        svgHeart.transform.position = new Vec3(10, 12, 5);
        svgHeart.transform.setScale([0.5, -0.5, 0.5]); // Flipped Y maintains its vertical direction
        svgHeart.paint.fill = new Color(0.9, 0.05, 0.2, 1.0);
        this.add(svgHeart);
        this.sceneModels.push(svgHeart);

        // Explicit scale vector is passed to preserve the negative Y orientation on hover
        this.bindBasicCallbacks(svgHeart, new Color(0.9, 0.05, 0.2, 1.0), true, new Vec3(0.5, -0.5, 0.5));

        // 2. Vector Font (Roboto TTF)
        const vectorText = new Text("vector", { fontSize: 4 });
        vectorText.transform.position = new Vec3(-22, 4, 12);
        vectorText.paint.fill = new Color(0.3, 0.9, 0.8, 1.0);
        this.add(vectorText);
        this.sceneModels.push(vectorText);

        this.bindBasicCallbacks(vectorText, new Color(0.3, 0.9, 0.8, 1.0), true);

        // 3. LaTeX Equation (MathJax)
        const mathEquation = new Tex("E = mc^2", { fontSize: 5 });
        mathEquation.transform.position = new Vec3(-2, 4, 12);
        mathEquation.paint.fill = new Color(0.8, 0.5, 1.0, 1.0);
        this.add(mathEquation);
        this.sceneModels.push(mathEquation);

        this.bindBasicCallbacks(mathEquation, new Color(0.8, 0.5, 1.0, 1.0), true);

        // 4. Multi-Channel Signed Distance Field (MSDF Text)
        const msdfText = new SDFText("msdf", { fontSize: 5 });
        msdfText.transform.position = new Vec3(14, 4, 12);
        msdfText.paint.fill = new Color(1.0, 0.4, 0.4, 1.0);
        this.add(msdfText);
        this.sceneModels.push(msdfText);

        this.bindBasicCallbacks(msdfText, new Color(1.0, 0.4, 0.4, 1.0), true);

        // =====================================================================
        // SECTION D: Global Update & Rendering Loop
        // =====================================================================
        this.always(() => {
            const rotSpeed = this.dt * 0.0003;

            this.sceneModels.forEach((model, index) => {
                if (model !== (this.interactionManager as any).activeDraggedEntity) {
                    const is3D = model.getComponent(ModelGeometry) !== null;

                    if (is3D) {
                        // 3D Objects: Rotate on all axes
                        model.transform.rotateWorldY(rotSpeed * (index % 2 === 0 ? 1 : -1));
                        model.transform.rotateWorldX(rotSpeed * 0.25);
                    } else {
                        // 2D Objects: Rotate on the Z-plane only to stay flat
                        model.transform.rotateWorldZ(rotSpeed * (index % 2 === 0 ? 1 : -1));
                    }
                }
            });

            this.invalidate();
        });
    }

    /**
     * Binds hover scale and drag effects dynamically to both 2D and 3D pipelines.
     */
    private bindBasicCallbacks(
        model: any,
        baseColor: Color,
        is2D: boolean = false,
        baseScale: Vec3 = new Vec3(1, 1, 1)
    ) {
        // Cache initial states
        const originalScale = baseScale.clone();
        const originalStrokeWidth = model.paint ? model.paint.strokeWidth : 0.0;

        // Chain interactive events directly on the Entity
        model
            .setDraggable(true)
            .setEvent("pointerover", () => {
                model.transform.setScale(originalScale.scale(1.1));

                if (is2D) {
                    model.paint.strokeWidth = 0.2;// originalStrokeWidth > 0.01 ? originalStrokeWidth * 1.5 : 1.0;
                } else {
                    model.material.emStrength = 1.8;
                }
                this.invalidate();
            })
            .setEvent("pointerout", () => {
                model.transform.setScale(originalScale);

                if (is2D) {
                    model.paint.strokeWidth = originalStrokeWidth;
                } else {
                    model.material.emStrength = 0.5;
                }
                this.invalidate();
            })
            .setEvent("dragstart", () => {
                if (is2D) {
                    model.paint.fill = new Color(1, 1, 1, 1);
                } else {
                    model.material.color = new Color(1, 1, 1, 1);
                }
                this.invalidate();
            })
            .setEvent("dragend", () => {
                if (is2D) {
                    model.paint.fill = baseColor;
                } else {
                    model.material.color = baseColor;
                }
                this.invalidate();
            });
    }
}
