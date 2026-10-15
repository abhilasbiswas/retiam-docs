import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, RTHTML, HTMLRenderMode, Math3D, Model, Color, OrbitCameraController, Plane, Vec3 } from "retiam";


export default class HTMLDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera and Mouse/Keyboard Controls
        this.camera.position.set([0, 0, 20]);
        new OrbitCameraController(this, this.camera, { radius: 40 });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "HTML as a live texture", "DOM content rendered into the scene");

        // 2. Define our interactive HTML/CSS UI
        // Note: The RTHTML canvas is 1024x1024px internally, so we use large font sizes.
        const htmlContent = `
            <div style="
                width: 100%; height: 100%;
                background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
                border-radius: 40px;
                border: 8px solid #ccc;
                box-sizing: border-box;
                padding: 40px;
                font-family: system-ui, sans-serif;
                box-shadow: inset 0 0 50px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            ">
                <h1 style="color: #333; font-size: 72px; margin-bottom: 20px;">WebGPU + HTML</h1>
                <p style="color: #666; font-size: 36px; margin-bottom: 40px;">
                    This is a fully interactive DOM element<br/>raytraced onto a 3D plane!
                </p>

                <!-- Inside your HTMLDemoScene -->
                <input type="text" placeholder="Type here..."
                    onmousedown="event.stopPropagation()"
                    style="font-size: 32px; padding: 20px; border-radius: 10px; border: 3px solid #aaa; width: 80%; margin-bottom: 40px;" />

                <input type="range" min="0" max="100"
                    onmousedown="event.stopPropagation()"
                    style="width: 80%; margin-bottom: 50px; transform: scale(2); cursor: pointer;" />

                <button
                    onclick="this.innerText = 'Clicked! ID: ' + Math.floor(Math.random() * 100); this.style.background = '#4CAF50';"
                    style="
                        font-size: 48px; padding: 20px 80px;
                        background: #008CBA; color: white;
                        border: none; border-radius: 20px;
                        cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    ">
                    Click Me
                </button>
            </div>
        `;

        // 3. Instantiate the RTHTML Entity (Width: 24, Height: 24 in 3D world units)
        const htmlBoard = new RTHTML(24, 24, "http://localhost:5173/studio/index.html?demo=compute_shader%2Fn_body");

        htmlBoard.transform.move([4, 4, 0])
        // Slant the board so it is obviously mapped in 3D space
        // htmlBoard.transform.rotateWorldY(-Math.PI / 6);
        // htmlBoard.transform.rotateWorldX(Math.PI / 12);
        this.add(htmlBoard);

        // Add a floor plane to catch shadows
        const floor = new Plane(200, 200);
        floor.transform.position = [0, -10, 0];
        floor.material.color = [0.3, 0.3, 0.3];
        this.add(floor);
        // 4. Add a standard 3D glossy sphere next to it for context/contrast
        const sphereMesh = Math3D.computeSmoothShading(
            Math3D.createSphere(5, 64, 64).vertices,
            Math3D.createSphere(5, 64, 64).indices!
        );
        const sphere = new Model(sphereMesh);
        sphere.material.color = new Color(1.0, 0.2, 0.5, 1.0);
        sphere.material.roughness = 0.2; // Make it glossy
        sphere.transform.position.set([16, 0, 5]);
        this.add(sphere);

        // 5. Add an animation loop
        this.always(() => {
            // Gently bob the sphere up and down using the scene's internal clock
            sphere.transform.position.y = Math.sin(this.time * 0.002) * 4;

            // Slowly rotate the HTML board back and forth
            // htmlBoard.transform.setRotationY_2D(Math.sin(this.time * 0.001) * 0.2 - (Math.PI / 6));

            this.invalidate(); // Request a redraw
        });
    }
}
