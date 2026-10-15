import { frameContent } from "../../shared/presentation";
import { demoBackground, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, SVG, Vec3, SVGPath, BLACK, Camera2DController, AABB, Entity } from "retiam";
import { OrbitCameraController } from "retiam";

export default class Paris30K extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.setBackgroundColor(demoBackground())
        // 1. Setup Camera for a 2D/3D presentation
        this.camera.position.set([550, -520, 1200]);
        new Camera2DController(this, this.camera, { zoom: 1200 });
        demoCaption(this, "Paris in 30,000 vector paths", "Pan and zoom to inspect the city map");

        // 2. Fetch the classic Ghostscript Tiger SVG from Wikimedia
        console.log("Fetching Tiger SVG...");
        const response = await fetch("/res/svg/paris-30k.svg");

        if (!response.ok) {
            console.error("Failed to fetch the SVG");
            return;
        }

        const svgText = await response.text();
        console.log("SVG fetched! Parsing...");

        // 3. Create the SVG Entity
        const tiger = new SVG(svgText,
            {
                method: "fast",
                tolerance: 0.0625,
                maxSegments: 16
            }
        );


        // 4. Transform to fit WebGPU's coordinate system
        // SVGs have Y pointing DOWN, but WebGPU has Y pointing UP.
        // We flip the Y-axis and center the tiger. The Ghostscript tiger is roughly 500x500 pixels.
        tiger.transform.scale(new Vec3(1, 1, 1)); // Flip Y-axis
        tiger.transform.shift(new Vec3(0, 0, 0)); // Center it (approximate offset for the Tiger)

        const map = new Entity();
        map.scissorClipRect = { width: 1096.25, height: 1060, offsetX: 548.125, offsetY: -530 };
        map.add(tiger);
        this.add(map);
        // Frame the map's paper bounds rather than off-page SVG construction paths.
        frameContent(this, new AABB(new Vec3(0, -1060, -1), new Vec3(1096.25, 0, 1)), 0.35);
        // tiger.setPixelTolerance(1)

        // 5. Add a slow rotation to show it off
        // this.always(() => {
        //     tiger.transform.rotateWorldY(this.dt * 0.0005);
        //     this.invalidate();
        // });
    }
}
