import {
    Scene, MorphModel, Text, Tex, Model, CameraModel,
    CameraController, Color, Math3D, MorphMode, Path,
    CENTER, Vec3, Quaternion, CustomAnimation, Rate
} from "retiam";
import { Instanced } from "retiam";
import { Raycaster } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ComplexSelectionScene extends Scene {
    private morphModel!: MorphModel;
    private mathEquation!: Tex;
    private splitText!: Text;
    private svgStar!: Path;
    private highPolySphere!: Model;
    private particleCloud!: Instanced;

    private hud!: HTMLDivElement;

    public async run() {
        // ===================================================================
        // 1. Setup Camera
        // ===================================================================
        this.camera.model = CameraModel.PERSPECTIVE;
        this.camera.position.set([0, 0, 45]);
        new CameraController(this, this.camera);

        this.clearColor(demoBackground()); // Dark deep space theme
        this.setupHUD();

        // ===================================================================
        // 2. Spawn COMPLEX GEOMETRIES in a circle layout
        // ===================================================================
        const layoutRadius = 15.0;

        // A. 3D MorphModel (Floating Top-Left)
        // Morphing continuously from a Cube to a Sphere [1].
        const sphereMesh = Math3D.computeSmoothShading(Math3D.createSphere(2.0, 32, 32).vertices, Math3D.createSphere(2.0, 32, 32).indices!);
        const cubeMesh = Math3D.computeSmoothShading(Math3D.createCube(3.0).vertices, Math3D.createCube(3.0).indices!);
        this.morphModel = new MorphModel(new Model(cubeMesh), new Model(sphereMesh), {
            mode: MorphMode.DUAL_CONTOURING,
            blendThreshold: 0.0 // Full geometry blending
        });
        this.morphModel.transform.position = [-layoutRadius, layoutRadius * 0.7, 0];
        this.morphModel.LABEL = "3D Morphing Model (Cube to Sphere)";
        this.add(this.morphModel);

        // B. 3D High-Poly Matte Model (Floating Top-Right)
        this.highPolySphere = new Model(Math3D.createSphere(2.5, 64, 64));
        this.highPolySphere.transform.position = [layoutRadius, layoutRadius * 0.7, 0];
        this.highPolySphere.material.color = new Color(0.9, 0.2, 0.3, 1.0);
        this.highPolySphere.material.roughness = 0.3;
        this.highPolySphere.LABEL = "3D High-Poly Sphere (12,000 Triangles)";
        this.add(this.highPolySphere);

        // C. 2D Complex SVG Vector Path (Floating Center-Bottom)
        // An intricately drawn decorative vector star
        const starSVG = "M 0,-3.5 L 1,-1 L 3.5,-1 L 1.5,1 L 2.5,3.5 L 0,2 L -2.5,3.5 L -1.5,1 L -3.5,-1 L -1,-1 Z";
        this.svgStar = new Path(starSVG);
        this.svgStar.transform.position = [0, -layoutRadius * 0.8, 0];
        this.svgStar.paint.fill = new Color(1.0, 0.6, 0.0, 1.0);
        this.svgStar.paint.stroke = new Color(1.0, 1.0, 1.0, 1.0);
        this.svgStar.paint.strokeWidth = 0.5;
        this.svgStar.LABEL = "Complex 2D SVG Star Path";
        this.add(this.svgStar);

        // D. 2D Interactive Text (Floating Mid-Left)
        this.splitText = new Text("GLYPH", { fontSize: 2.0, anchor: CENTER });
        this.splitText.decompose();
        this.splitText.transform.position = [-layoutRadius, -2.0, 0];
        this.splitText.LABEL = "Interactive Vector Text Group";
        this.splitText.chars.forEach((char, idx) => {
            if (char) {
                char.paint.fill = new Color(0.2, 0.8, 0.9, 1.0);
                char.LABEL = `Letter Glyph '${this.splitText.rawText[idx]}'`;
            }
        });
        this.add(this.splitText);

        // E. 2D Complex TeX Equation (Floating Mid-Right)
        // A mathematically complex integral equation rendered to SVG vector curves
        this.mathEquation = new Tex("\\oint_C \\mathbf{B} \\cdot d\\mathbf{l} = \\mu_0 I_{\\text{enc}}", { fontSize: 1.2 });
        this.mathEquation.transform.position = [layoutRadius - 8.0, -1.0, 0];
        this.mathEquation.LABEL = "LaTeX Math Integration Group";
        this.mathEquation.getPaths().forEach((p, idx) => {
            p.paint.fill = new Color(0.9, 0.9, 0.1, 1.0);
            p.LABEL = `LaTeX Path Segment #${idx}`;
        });
        this.add(this.mathEquation);

        // F. 2D/3D Instanced Swarm (Floating Center-Top)
        // A cloud of 2,000 tiny particles orbiting the center
        const particleCount = 2000;
        this.particleCloud = new Instanced(new Model(Math3D.createCube(0.12)), particleCount);
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const r = 4.0 + Math.random() * 1.5;
            this.particleCloud.setInstancePosition(i, new Vec3(Math.cos(angle) * r, Math.sin(angle) * r + 10.0, (Math.random() - 0.5) * 2.0));
            this.particleCloud.setInstanceColor(i, new Color(0.6, 0.8, 1.0, 0.5));
        }
        this.particleCloud.LABEL = "GPU Instanced Particle Cloud (2,000 Elements)";
        this.add(this.particleCloud);

        // ===================================================================
        // 3. Mouse Picking Event Listener
        // ===================================================================
        const canvasElement = this.canvas as HTMLCanvasElement;

        // --- FIX: Make the callback async so we can await the GPU Raycast ---
        canvasElement.addEventListener('mousedown', async (event) => {
            const viewProj = this.default_view.getViewProjection();
            const ray = Raycaster.getRayFromMouse(event.clientX, event.clientY, canvasElement, viewProj);

            // --- FIX: Await the asynchronous compute-backed cast ---
            const hit = await Raycaster.cast(ray, this.entities);

            if (hit) {
                // Hit feedback
                if (hit.instanceId !== undefined) {
                    this.hud.innerHTML = `
                        <strong>Selection Class:</strong> GPU Instanced Element<br/>
                        <strong>Selected ID:</strong> Particle #${hit.instanceId}<br/>
                        <strong>Group Name:</strong> ${hit.entity.LABEL}<br/>
                        <strong>Hit Point:</strong> (${hit.point.x.toFixed(2)}, ${hit.point.y.toFixed(2)}, ${hit.point.z.toFixed(2)})
                    `;
                    this.hud.style.borderColor = "#ffcc00";

                    // Turn selected particle Yellow and inflate it!
                    this.particleCloud.setInstanceColor(hit.instanceId, new Color(1.0, 1.0, 0.0, 1.0));
                    this.particleCloud.setInstanceScale(hit.instanceId, 3.5);
                    this.particleCloud.updateInstances();
                }
                else if (hit.entity.parent) {
                    this.hud.innerHTML = `
                        <strong>Selection Class:</strong> Complex Sub-Glyph Path<br/>
                        <strong>Varying Path Name:</strong> ${hit.entity.LABEL}<br/>
                        <strong>Parent Complex Group:</strong> ${hit.entity.parent.LABEL}<br/>
                        <strong>Distance to Camera:</strong> ${hit.distance.toFixed(1)} units
                    `;
                    this.hud.style.borderColor = "#00ffcc";

                    // Highlight the clicked vector letter
                    hit.entity.paint.fill = new Color(1.0, 1.0, 1.0, 1.0); // Highlight to pure white
                    this.invalidate();
                }
                // If we clicked a standard root Model/Mesh (no parent)
                else {
                    this.hud.innerHTML = `
                        <strong>Selection Class:</strong> Standard 3D Entity<br/>
                        <strong>Picked Object Name:</strong> ${hit.entity.LABEL}<br/>
                        <strong>Hit Point:</strong> (${hit.point.x.toFixed(2)}, ${hit.point.y.toFixed(2)}, ${hit.point.z.toFixed(2)})<br/>
                        <strong>Distance to Camera:</strong> ${hit.distance.toFixed(1)} units
                    `;
                    this.hud.style.borderColor = "#ff00cc";

                    // Trigger color change
                    if (hit.entity === this.morphModel) {
                        this.morphModel.material.color = new Color(1.0, 1.0, 0.0, 1.0); // Make morph model yellow
                    } else if (hit.entity instanceof Model) {
                        hit.entity.material.color = new Color(1.0, 0.8, 0.2, 1.0);
                    } else {
                        hit.entity.paint.fill = new Color(1.0, 0.8, 0.2, 1.0);
                    }
                    this.invalidate();
                }
            } else {
                this.hud.innerHTML = "<strong>Selection Class:</strong> None (Void clicked)";
                this.hud.style.borderColor = "#555";
            }
        });

        // ===================================================================
        // 4. Update / Animation Loops
        // ===================================================================
        // this.always(() => {
        //     const dt = this.dt * 0.001;

        //     // Rotate the complex 3D sphere
        //     this.highPolySphere.transform.rotate(Quaternion.fromEuler(dt * 0.3, dt * 0.5, 0));

        //     // Spin the particle cloud
        //     this.particleCloud.transform.rotateWorldY(-dt * 0.2);

        //     // Rotate the vector SVG star
        //     this.svgStar.transform.setRotationZ(this.time * 0.001);

        //     this.invalidate();
        // });

        // Loop the MorphModel animation indefinitely (Cube -> Sphere -> Cube)
        while (true) {
            await this.play(new CustomAnimation((t) => {
                this.morphModel.setWeight(t);
            }, { duration: 4000, rate_func: Rate.easeInOutCubic() }));

            await this.wait(500);

            await this.play(new CustomAnimation((t) => {
                this.morphModel.setWeight(1.0 - t);
            }, { duration: 4000, rate_func: Rate.easeInOutCubic() }));

            await this.wait(500);
        }
    }

    private setupHUD() {
        this.hud = document.createElement('div');
        this.hud.style.position = 'absolute';
        this.hud.style.bottom = '20px';
        this.hud.style.left = '20px';
        this.hud.style.background = 'rgba(10, 10, 20, 0.9)';
        this.hud.style.color = '#fff';
        this.hud.style.fontFamily = 'monospace';
        this.hud.style.fontSize = '12px';
        this.hud.style.padding = '15px';
        this.hud.style.borderRadius = '8px';
        this.hud.style.borderLeft = '4px solid #555';
        this.hud.style.minWidth = '340px';
        this.hud.style.boxShadow = '0 6px 20px rgba(0,0,0,0.6)';
        this.hud.style.pointerEvents = 'none'; // Passthrough
        this.hud.innerHTML = `
            <strong>Selection HUD</strong><br/>
            Click any complex 2D or 3D element to select.<br/>
            - Pick individual letters out of the text!<br/>
            - Pick LaTeX symbols out of the equation!<br/>
            - Pick particles out of the rotating ring!<br/>
            - Select the dynamic morphing model!
        `;
        document.body.appendChild(this.hud);
    }
}
