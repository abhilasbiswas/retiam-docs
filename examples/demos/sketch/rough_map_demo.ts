import { frameContent } from "../../shared/presentation";
import { demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/sketch/rough_map_demo.ts
// Hand-drawn USA Map showcase recreated with Retiam and rough.js
// =========================================================================

import {
    Scene,
    Camera2DController,
    Color,
    VGroup,
    Concurrent,
    createAnim,
} from "retiam";
import { roughify, RoughShape } from "retiam/rough";
import { USA_MAP } from "./usa_map_data";

export default class RoughMapDemoScene extends Scene {
    public override async run(): Promise<void> {
        new Camera2DController(this, this.camera, { zoom: 17.5 });
        demoCaption(this, "A map drawn with rough.js", "Fifty state paths with distinct hatching", true);
        this.clearColor(Color.fromHex("#FFFFFF"));

        const mapGroup = new VGroup();

        // ViewBox is "192 9 1028 746"
        // Center the canvas nicely in Retiam world coordinates
        const scale = 0.022;
        const cx = 715;
        const cy = 370;

        mapGroup.transform.position.set([-cx * scale, cy * scale, 0]);

        const stateShapes: RoughShape[] = [];

        for (const state of USA_MAP.states) {
            // Distinct deterministic seed for each state
            const seed = (state.id.charCodeAt(0) * 31 + (state.id.charCodeAt(1) || 0)) * 7;

            const shape = roughify(state.d, {
                stroke: "#1a1a1a",
                strokeWidth: 1.5,
                fill: state.fill,
                fillStyle: state.fillStyle,
                hachureAngle: state.hachureAngle ?? -41,
                hachureGap: state.hachureGap ?? 4,
                roughness: 1.25,
                bowing: 1.0,
                pixelScale: scale,
                flipY: true,
                seed,
            });

            stateShapes.push(shape);
            mapGroup.add(shape);
        }

        this.add(mapGroup);
        frameContent(this, mapGroup, 0.28);

        // Entrance animation: draw all 50 states concurrently
        const anims = stateShapes.map(s => createAnim(s, { duration: 1500 }));
        await this.play(new Concurrent(anims, { duration: 1600 }));

        await this.wait(5000);
    }
}
