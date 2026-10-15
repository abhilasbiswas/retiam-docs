import { frameContent } from "../../shared/presentation";
import { demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/sketch/excalidraw_map_demo.ts
// Hand-drawn USA Map showcase recreated with Retiam's native Excalidraw engine
// High-performance vector architecture: ExcalidrawModifier + HachureGenerator
// =========================================================================

import {
    Scene,
    Camera2DController,
    Color,
    VGroup,
    Path,
    PathGeometryUtils,
    Concurrent,
    createAnim,
} from "retiam";
import { USA_MAP } from "./usa_map_data";

export default class ExcalidrawMapDemoScene extends Scene {
    public override async run(): Promise<void> {
        new Camera2DController(this, this.camera, { zoom: 17.5 });
        demoCaption(this, "A map in hand-drawn strokes", "Native Excalidraw paths and deterministic hatching", true);
        this.clearColor(Color.fromHex("#FFFFFF"));

        const mapGroup = new VGroup();

        // Canvas center and scaling into Retiam world coordinates
        const scale = 0.022;
        const cx = 715;
        const cy = 370;

        const statePaths: Path[] = [];

        for (const state of USA_MAP.states) {
            const rawContours = PathGeometryUtils.decode(state.d);
            const worldContours = rawContours.map(c => {
                const out = new Array(c.length);
                for (let i = 0; i < c.length; i += 2) {
                    out[i] = (c[i] - cx) * scale;
                    out[i + 1] = -(c[i + 1] - cy) * scale;
                }
                return out;
            });

            const seed = (state.id.charCodeAt(0) * 31 + (state.id.charCodeAt(1) || 0)) * 7;

            // Style with native Excalidraw engine (leveraging optimized HachureGenerator & direct contours)
            const path = new Path(worldContours);
            path.toExcalidraw({
                preset: 'clean',
                stroke: '#141414',
                strokeWidth: 0.035,
                fill: state.fill,
                fillStyle: state.fillStyle === "solid" ? "filled" : state.fillStyle,
                fillGap: 0.18,
                fillAngle: state.hachureAngle ?? -41,
                fillLineWidth: 0.032,
                fillBackground: false,
                roughness: 0.20,
                bowing: 0.12,
                seed,
            });

            statePaths.push(path);
            mapGroup.add(path);
        }

        this.add(mapGroup);
        frameContent(this, mapGroup, 0.28);

        // Entrance animation: draw all states concurrently with Excalidraw sketch animation
        const anims = statePaths.map(p => createAnim(p, { duration: 1500 }));
        await this.play(new Concurrent(anims, { duration: 1600 }));

        await this.wait(5000);
    }
}
