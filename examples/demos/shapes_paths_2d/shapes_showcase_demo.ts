// =========================================================================
// File: examples/demos/shapes_paths_2d/shapes_showcase_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    Text,
    CENTER,
    Create,
    Rate,
    OrbitCameraController,
    RED,
    BLUE,
    BLUE_A,
    BLUE_B,
    GREEN,
} from "retiam";
import {
    Star,
    Squircle,
    Heart,
    Gear2D,
    Cross,
    Chevron,
    Diamond,
    Trapezoid,
    Parallelogram,
    Crescent,
    Capsule3D,
    TorusKnot3D,
    Helix3D,
    RoundedBox3D,
    Icosahedron,
    Gear3D,
    Diamond3D,
    Bipyramid3D,
    Superellipsoid3D,
} from "retiam/shapes";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class ShapesShowcaseDemoScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 0.4, 27]);
        this.clearColor(demoBackground()); // Deep obsidian canvas
        new OrbitCameraController(this, this.camera);

        // Header Title
        const title = new Text("Retiam Geometric Shapes Library", { fontSize: 0.88, anchor: CENTER });
        title.paint.fill = new Color(0.97, 0.98, 1.0, 1.0);
        title.move([0, 9.3, 0]);
        this.add(title);

        const subtitle = new Text("Comprehensive Suite of 2D Vector Primitives & 3D WebGPU Procedural Meshes", { fontSize: 0.38, anchor: CENTER });
        subtitle.paint.fill = new Color(0.58, 0.64, 0.72, 1.0);
        subtitle.move([0, 8.5, 0]);
        this.add(subtitle);

        // =====================================================================
        // SECTION 1: 2D SHAPES - ROW 1 (Y = 6.2)
        // =====================================================================
        const row2D_1_Y = 6.2;
        const row2D_1_LblY = 4.8;
        const xs5 = [-8.0, -4.0, 0.0, 4.0, 8.0];

        // 1. Diamond (Rhombus with rounded fillets)
        const diamond = new Diamond({ width: 2.2, height: 2.2, cornerRadius: 0.12 });
        diamond.paint.fill = new Color(0.2, 0.75, 0.98, 0.35); // Diamond Cyan
        diamond.paint.stroke = new Color(0.35, 0.85, 1.0, 1.0);
        diamond.paint.strokeWidth = 0.06;
        diamond.move([xs5[0], row2D_1_Y, 0]);
        this.add(diamond);

        const diamondLabel = new Text("Diamond", { fontSize: 0.3, anchor: CENTER });
        diamondLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        diamondLabel.move([xs5[0], row2D_1_LblY, 0]);
        this.add(diamondLabel);

        // 2. Star with rounded fillets
        const star = new Star({ points: 5, outerRadius: 1.25, innerRadius: 0.62, cornerRadius: 0.1 });
        star.paint.fill = new Color(0.95, 0.65, 0.15, 0.35); // Amber
        star.paint.stroke = new Color(0.98, 0.75, 0.2, 1.0);
        star.paint.strokeWidth = 0.06;
        star.move([xs5[1], row2D_1_Y, 0]);
        this.add(star);

        const starLabel = new Text("Star", { fontSize: 0.3, anchor: CENTER });
        starLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        starLabel.move([xs5[1], row2D_1_LblY, 0]);
        this.add(starLabel);

        // 3. Heart
        const heart = new Heart({ width: 2.2, height: 2.2, cleftDepth: 0.28 });
        heart.paint.fill = new Color(0.95, 0.25, 0.45, 0.35); // Rose
        heart.paint.stroke = new Color(1.0, 0.3, 0.5, 1.0);
        heart.paint.strokeWidth = 0.06;
        heart.move([xs5[2], row2D_1_Y, 0]);
        this.add(heart);

        const heartLabel = new Text("Heart", { fontSize: 0.3, anchor: CENTER });
        heartLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        heartLabel.move([xs5[2], row2D_1_LblY, 0]);
        this.add(heartLabel);

        // 4. Squircle (Superellipse)
        const squircle = new Squircle({ width: 2.1, height: 2.1, n: 4.5 });
        squircle.paint.fill = new Color(0.2, 0.85, 0.75, 0.35); // Mint Teal
        squircle.paint.stroke = new Color(0.25, 0.95, 0.85, 1.0);
        squircle.paint.strokeWidth = 0.06;
        squircle.move([xs5[3], row2D_1_Y, 0]);
        this.add(squircle);

        const sqLabel = new Text("Squircle", { fontSize: 0.3, anchor: CENTER });
        sqLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        sqLabel.move([xs5[3], row2D_1_LblY, 0]);
        this.add(sqLabel);

        // 5. Crescent (Moon)
        const crescent = new Crescent({ radius: 1.25, innerRadius: 1.05, offset: 0.55 });
        crescent.paint.fill = new Color(0.98, 0.85, 0.2, 0.35); // Golden Moon
        crescent.paint.stroke = new Color(1.0, 0.92, 0.35, 1.0);
        crescent.paint.strokeWidth = 0.06;
        crescent.move([xs5[4], row2D_1_Y, 0]);
        this.add(crescent);

        const crescentLabel = new Text("Crescent", { fontSize: 0.3, anchor: CENTER });
        crescentLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        crescentLabel.move([xs5[4], row2D_1_LblY, 0]);
        this.add(crescentLabel);

        // =====================================================================
        // SECTION 2: 2D SHAPES - ROW 2 (Y = 3.2)
        // =====================================================================
        const row2D_2_Y = 3.2;
        const row2D_2_LblY = 1.8;

        // 6. Trapezoid (Isosceles trapezoid with filleted corners)
        const trapezoid = new Trapezoid({ topWidth: 1.4, bottomWidth: 2.4, height: 1.7, cornerRadius: 0.1 });
        trapezoid.paint.fill = new Color(0.95, 0.45, 0.15, 0.35); // Coral
        trapezoid.paint.stroke = new Color(1.0, 0.55, 0.2, 1.0);
        trapezoid.paint.strokeWidth = 0.06;
        trapezoid.move([xs5[0], row2D_2_Y, 0]);
        this.add(trapezoid);

        const trapLabel = new Text("Trapezoid", { fontSize: 0.3, anchor: CENTER });
        trapLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        trapLabel.move([xs5[0], row2D_2_LblY, 0]);
        this.add(trapLabel);

        // 7. Parallelogram
        const parallelogram = new Parallelogram({ width: 2.2, height: 1.6, skew: 0.65, cornerRadius: 0.08 });
        parallelogram.paint.fill = new Color(0.55, 0.45, 0.95, 0.35); // Violet
        parallelogram.paint.stroke = new Color(0.65, 0.55, 1.0, 1.0);
        parallelogram.paint.strokeWidth = 0.06;
        parallelogram.move([xs5[1], row2D_2_Y, 0]);
        this.add(parallelogram);

        const paraLabel = new Text("Parallelogram", { fontSize: 0.3, anchor: CENTER });
        paraLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        paraLabel.move([xs5[1], row2D_2_LblY, 0]);
        this.add(paraLabel);

        // 8. Cross
        const cross = new Cross({ width: 2.1, height: 2.1, thickness: 0.7, cornerRadius: 0.08 });
        cross.paint.fill = new Color(0.15, 0.85, 0.55, 0.35); // Emerald
        cross.paint.stroke = new Color(0.2, 0.95, 0.65, 1.0);
        cross.paint.strokeWidth = 0.06;
        cross.move([xs5[2], row2D_2_Y, 0]);
        this.add(cross);

        const crossLabel = new Text("Cross", { fontSize: 0.3, anchor: CENTER });
        crossLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        crossLabel.move([xs5[2], row2D_2_LblY, 0]);
        this.add(crossLabel);

        // 9. Chevron
        const chevron = new Chevron({ width: 2.1, height: 1.5, thickness: 0.55, cornerRadius: 0.08 });
        chevron.paint.fill = new Color(0.95, 0.35, 0.65, 0.35); // Magenta
        chevron.paint.stroke = new Color(1.0, 0.45, 0.75, 1.0);
        chevron.paint.strokeWidth = 0.06;
        chevron.move([xs5[3], row2D_2_Y, 0]);
        this.add(chevron);

        const chevLabel = new Text("Chevron", { fontSize: 0.3, anchor: CENTER });
        chevLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        chevLabel.move([xs5[3], row2D_2_LblY, 0]);
        this.add(chevLabel);

        // 10. Gear2D
        const gear2d = new Gear2D({ teeth: 10, outerRadius: 1.25, rootRadius: 0.9, boreRadius: 0.35 });
        gear2d.paint.fill = new Color(0.55, 0.45, 0.95, 0.35); // Purple
        gear2d.paint.stroke = new Color(0.65, 0.55, 1.0, 1.0);
        gear2d.paint.strokeWidth = 0.06;
        gear2d.move([8, row2D_2_LblY + 1.5, 0]);
        this.add(gear2d);

        const gearLabel = new Text("Gear2D", { fontSize: 0.3, anchor: CENTER });
        gearLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        gearLabel.move([xs5[4], row2D_2_LblY, 0]);
        this.add(gearLabel);

        // =====================================================================
        // SECTION 3: 3D SHAPES - ROW 1 (Y = -1.2)
        // =====================================================================
        const row3D_1_Y = -1.2;
        const row3D_1_LblY = -2.7;

        // 1. Diamond3D (Brilliant-cut faceted gemstone)
        const diamond3d = new Diamond3D({ sides: 8, radius: 0.9, height: 1.5, tableRadius: 0.45, crownRatio: 0.35, girdleThickness: 0.08 });
        diamond3d.material.color = new Color(0.2, 0.8, 1.0, 1.0); // Electric Cyan Diamond
        diamond3d.material.roughness = 0.15;
        diamond3d.material.metallic = 0.9;
        diamond3d.move([xs5[0], row3D_1_Y, 0]);
        diamond3d.transform.rotateWorldX(Math.PI / 6);
        this.add(diamond3d);

        const d3dLabel = new Text("Diamond3D", { fontSize: 0.3, anchor: CENTER });
        d3dLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        d3dLabel.move([xs5[0], row3D_1_LblY, 0]);
        this.add(d3dLabel);

        // 2. Bipyramid3D (Dual-apex regular bipyramid)
        const bipyramid = new Bipyramid3D({ sides: 6, baseRadius: 0.95, height: 1.8 });
        bipyramid.material.color = new Color(0.95, 0.35, 0.55, 1.0); // Crimson Ruby
        bipyramid.material.roughness = 0.2;
        bipyramid.material.metallic = 0.85;
        bipyramid.move([xs5[1], row3D_1_Y, 0]);
        bipyramid.transform.rotateWorldZ(Math.PI / 8);
        this.add(bipyramid);

        const bipyLabel = new Text("Bipyramid3D", { fontSize: 0.3, anchor: CENTER });
        bipyLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        bipyLabel.move([xs5[1], row3D_1_LblY, 0]);
        this.add(bipyLabel);

        // 3. Superellipsoid3D (Diamond star superquadric: e1=2.0, e2=2.0)
        const superEllip = new Superellipsoid3D({ radiusX: 0.95, radiusY: 0.95, radiusZ: 0.95, e1: 1.8, e2: 1.8 });
        superEllip.material.color = new Color(0.15, 0.85, 0.65, 1.0); // Emerald Star
        superEllip.material.roughness = 0.22;
        superEllip.material.metallic = 0.8;
        superEllip.move([xs5[2], row3D_1_Y, 0]);
        superEllip.transform.rotateWorldX(Math.PI / 5);
        this.add(superEllip);

        const seLabel = new Text("Superellipsoid3D", { fontSize: 0.28, anchor: CENTER });
        seLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        seLabel.move([xs5[2], row3D_1_LblY, 0]);
        this.add(seLabel);

        // 4. Capsule 3D
        const cap3d = new Capsule3D({ radius: 0.5, length: 1.0, radialSegments: 32 });
        cap3d.material.color = new Color(0.95, 0.65, 0.15, 1.0); // Sunburst Gold
        cap3d.material.roughness = 0.2;
        cap3d.material.metallic = 0.9;
        cap3d.move([xs5[3], row3D_1_Y, 0]);
        cap3d.transform.rotateWorldZ(Math.PI / 4);
        this.add(cap3d);

        const cap3dLabel = new Text("Capsule3D", { fontSize: 0.3, anchor: CENTER });
        cap3dLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        cap3dLabel.move([xs5[3], row3D_1_LblY, 0]);
        this.add(cap3dLabel);

        // 5. Torus Knot 3D
        const knot = new TorusKnot3D({ radius: 0.7, tubeRadius: 0.16, p: 2, q: 3, tubularSegments: 96 });
        knot.material.color = new Color(0.65, 0.45, 1.0, 1.0); // Royal Purple
        knot.material.roughness = 0.2;
        knot.material.metallic = 0.9;
        knot.move([xs5[4], row3D_1_Y, 0]);
        this.add(knot);

        const knotLabel = new Text("TorusKnot3D", { fontSize: 0.3, anchor: CENTER });
        knotLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        knotLabel.move([xs5[4], row3D_1_LblY, 0]);
        this.add(knotLabel);

        // =====================================================================
        // SECTION 4: 3D SHAPES - ROW 2 (Y = -4.5)
        // =====================================================================
        const row3D_2_Y = -4.5;
        const row3D_2_LblY = -6.0;
        const xs4 = [-6.0, -2.0, 2.0, 6.0];

        // 6. Helix 3D
        const helix = new Helix3D({ radius: 0.6, pitch: 0.4, turns: 3, tubeRadius: 0.08 });
        helix.material.color = new Color(0.95, 0.3, 0.5, 1.0);
        helix.material.roughness = 0.3;
        helix.material.metallic = 0.8;
        helix.move([xs4[0], row3D_2_Y, 0]);
        this.add(helix);

        const helixLabel = new Text("Helix3D", { fontSize: 0.3, anchor: CENTER });
        helixLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        helixLabel.move([xs4[0], row3D_2_LblY, 0]);
        this.add(helixLabel);

        // 7. Rounded Box 3D
        const rbox = new RoundedBox3D({ width: 1.2, height: 1.2, depth: 1.2, radius: 0.16, segments: 6 });
        rbox.material.color = new Color(0.2, 0.85, 0.55, 1.0);
        rbox.material.roughness = 0.2;
        rbox.material.metallic = 0.7;
        rbox.move([xs4[1], row3D_2_Y, 0]);
        rbox.transform.rotateWorldX(Math.PI / 5);
        rbox.transform.rotateWorldY(Math.PI / 4);
        this.add(rbox);

        const rboxLabel = new Text("RoundedBox3D", { fontSize: 0.3, anchor: CENTER });
        rboxLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        rboxLabel.move([xs4[1], row3D_2_LblY, 0]);
        this.add(rboxLabel);

        // 8. Icosahedron
        const ico = new Icosahedron(0.9);
        ico.material.color = new Color(0.95, 0.75, 0.2, 1.0);
        ico.material.roughness = 0.25;
        ico.material.metallic = 0.85;
        ico.move([xs4[2], row3D_2_Y, 0]);
        this.add(ico);

        const icoLabel = new Text("Icosahedron", { fontSize: 0.3, anchor: CENTER });
        icoLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        icoLabel.move([xs4[2], row3D_2_LblY, 0]);
        this.add(icoLabel);

        // 9. Gear 3D
        const gear3d = new Gear3D({ teeth: 12, outerRadius: 0.9, rootRadius: 0.6, height: 0.35, boreRadius: 0.22 });
        gear3d.material.color = new Color(0.95, 0.5, 0.2, 1.0);
        gear3d.material.roughness = 0.3;
        gear3d.material.metallic = 0.8;
        gear3d.move([xs4[3], row3D_2_Y, 0]);
        gear3d.transform.rotateWorldX(Math.PI / 3);
        this.add(gear3d);

        const gear3dLabel = new Text("Gear3D", { fontSize: 0.3, anchor: CENTER });
        gear3dLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        gear3dLabel.move([xs4[3], row3D_2_LblY, 0]);
        this.add(gear3dLabel);

        frameContent(this, [...this.entities], 0.18);

        // Orchestrate continuous rotations for 3D meshes and 2D gear
        this.always((_t, dt) => {
            const rotSpeed = dt * 0.0012;
            gear2d.transform.rotateWorldZ(rotSpeed);

            diamond3d.transform.rotateWorldY(rotSpeed * 1.3);
            diamond3d.transform.rotateWorldX(rotSpeed * 0.5);

            bipyramid.transform.rotateWorldY(rotSpeed * 1.1);
            bipyramid.transform.rotateWorldZ(rotSpeed * 0.7);

            superEllip.transform.rotateWorldY(rotSpeed * 0.9);
            superEllip.transform.rotateWorldX(rotSpeed * 0.6);

            cap3d.transform.rotateWorldY(rotSpeed);
            knot.transform.rotateWorldY(rotSpeed * 1.2);
            knot.transform.rotateWorldX(rotSpeed * 0.6);
            helix.transform.rotateWorldY(rotSpeed * 1.5);
            rbox.transform.rotateWorldY(rotSpeed);
            rbox.transform.rotateWorldX(rotSpeed * 0.5);
            ico.transform.rotateWorldY(rotSpeed * 0.8);
            ico.transform.rotateWorldZ(rotSpeed * 0.6);
            gear3d.transform.rotateWorldY(rotSpeed);
        });

        // Intro animation
        await this.play([
            new Create(diamond, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(star, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(heart, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(squircle, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(crescent, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(trapezoid, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(parallelogram, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(cross, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(chevron, { duration: 900, rate_func: Rate.easeOutQuad() }),
            new Create(gear2d, { duration: 900, rate_func: Rate.easeOutQuad() }),
        ]);
    }
}
