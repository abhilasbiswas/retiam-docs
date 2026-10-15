import { frameStage, demoCaption } from "../../shared/presentation";

// =========================================================================
// 1. COMPLEX MULTI-PATH SVG SOURCE ASSETS (XML)
// =========================================================================

import { Scene, SVG, CameraController, Axes, Color, PathEqualizer, Write, VectorTransform, Rate, MatchingPolicy, Circle, OrbitCameraController, Vec3 } from "retiam";
// A 2-path SVG representing a Security Shield with an inner Star
const shieldSvg = `
<svg viewBox="-10 -10 20 20">
  <!-- Path 1: Outer Shield -->
  <path fill="#1966d9" fill-opacity="0.85" stroke="#66b2ff" stroke-width="0.8"
        d="M -5,-6 C -5,-6 5,-6 5,-6 C 5,-2 5,2.5 0,6.5 C -5,2.5 -5,-2 -5,-6 Z" />
  <!-- Path 2: Inner Star -->
  <path fill="#ffcc33" fill-opacity="0.9" stroke="#ffffff" stroke-width="0.04"
        d="M 0,-4 L 0.9,-1.3 L 3.5,-1.3 L 1.4,0.2 L 2.2,2.8 L 0,1.2 L -2.2,2.8 L -1.4,0.2 L -3.5,-1.3 L -0.9,-1.3 Z" />
</svg>
`;

// A 2-path SVG representing a Search Magnifying Glass
const searchSvg = `
<svg viewBox="-10 -10 20 20">
  <!-- Path 1: Lens Ring -->
  <path fill="#f21973" fill-opacity="0.85" stroke="#ff80bf" stroke-width="0.08"
        d="M -1.5,-1.5 C 1.0,-4.0 5.0,-4.0 7.5,-1.5 C 10.0,1.0 10.0,5.0 7.5,7.5 C 5.0,10.0 1.0,10.0 -1.5,7.5 C -4.0,5.0 -4.0,1.0 -1.5,-1.5 Z" />
  <!-- Path 2: Diagonal Handle -->
  <path fill="#666673" fill-opacity="0.9" stroke="#d9d9d9" stroke-width="0.05"
        d="M -2.8,5.2 L -8.2,10.6 L -9.6,9.2 L -4.2,3.8 Z" />
</svg>
`;

// =========================================================================
// 2. SHOWCASE SCENE
// =========================================================================
export default class SvgMorphShowcaseScene extends Scene {
    private securityIcon!: SVG;
    private searchIcon!: SVG;

    public async run() {
        frameStage(this, 110, 110);
        demoCaption(this, "Multi-path SVG morphing", "A shield transforms into a search icon");
        // this.camera.position.set([0, 0, 30]);
        // new OrbitCameraController(this, this.camera, new Vec3(), 30);

        const grid = new Axes({ width: 80, height: 80, showGrid: true });
        grid.z_index = -1.0;
        this.add(grid);

        // 1. Create the SVGs (Styling is done automatically via the XML!)
        this.securityIcon = new SVG(shieldSvg);
        this.securityIcon.transform.setScale(3);

        this.searchIcon = new SVG(searchSvg);

        this.always(() => this.invalidate());

        // 2. Multi-Path Entrance Sequence
        // Write takes an array of paths! We extract them natively using PathEqualizer.
        await this.play(new Write(this.securityIcon, { duration: 1800 }));

        await this.wait(1000);

        let circle = new Circle(10);

        // 3. Infinite Morphing Loop
        // VectorTransform automatically crawls the SVG hierarchy to find children paths.
        while (true) {
            await this.play(new VectorTransform(this.securityIcon, this.searchIcon, {
                duration: 2800,
                rate_func: Rate.easeInOutCubic()
            }));
            await this.wait(1500);

            await this.play(new VectorTransform(this.searchIcon, this.securityIcon, {
                duration: 2800,
                rate_func: Rate.easeInOutCubic()
            }));
            await this.wait(1500);
        }
    }
}
