// =========================================================================
// File: examples/demos/shapes_paths_2d/shapes_showcase_part2_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    Text,
    CENTER,
    OrbitCameraController,
} from "retiam";
import {
    RegularPolygon,
    Capsule,
    Teardrop,
    Annulus,
    Sector,
    Spiral2D,
    CurvedArrow,
    DoubleArrow,
    Waveform2D,
    ArchitecturalProfile,
    Prism3D,
    Pyramid3D,
    TruncatedCone3D,
    Tube3D,
    Ellipsoid3D,
    Wedge3D,
    Dodecahedron,
    Octahedron,
    Tetrahedron,
} from "retiam/shapes";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class ShapesShowcasePart2DemoScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.camera.position.set([0, -0.6, 26.5]);
        this.clearColor(demoBackground()); // Deep obsidian canvas
        new OrbitCameraController(this, this.camera);

        // Header Title
        const title = new Text("Retiam Geometric Shapes Library — Part 2", { fontSize: 0.85, anchor: CENTER });
        title.paint.fill = new Color(0.97, 0.98, 1.0, 1.0);
        title.move([0, 8.2, 0]);
        this.add(title);

        const subtitle = new Text("Mathematical 2D Profiles & Procedural 3D Polyhedra (libs/shapes)", { fontSize: 0.38, anchor: CENTER });
        subtitle.paint.fill = new Color(0.58, 0.64, 0.72, 1.0);
        subtitle.move([0, 7.4, 0]);
        this.add(subtitle);

        // =====================================================================
        // SECTION 1: 2D SHAPES - ROW 1 (Mathematical Curves & Rings)
        // =====================================================================
        const row2D_1_Y = 5.0;
        const row2D_1_LabelY = 3.4;

        // 1. RegularPolygon (Octagon with filleted corners)
        const poly = new RegularPolygon({ sides: 8, radius: 1.15, cornerRadius: 0.1 });
        poly.paint.fill = new Color(0.95, 0.65, 0.15, 0.35); // Amber
        poly.paint.stroke = new Color(1.0, 0.75, 0.2, 1.0);
        poly.paint.strokeWidth = 0.06;
        poly.move([-8.0, row2D_1_Y, 0]);
        this.add(poly);

        const polyLabel = new Text("RegularPolygon", { fontSize: 0.28, anchor: CENTER });
        polyLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        polyLabel.move([-8.0, row2D_1_LabelY, 0]);
        this.add(polyLabel);

        // 2. Capsule 2D (Stadium Pill)
        const capsule2d = new Capsule({ radius: 0.65, length: 1.2, orientation: "horizontal" });
        capsule2d.paint.fill = new Color(0.15, 0.85, 0.75, 0.35); // Turquoise
        capsule2d.paint.stroke = new Color(0.2, 0.95, 0.85, 1.0);
        capsule2d.paint.strokeWidth = 0.06;
        capsule2d.move([-4.0, row2D_1_Y, 0]);
        this.add(capsule2d);

        const capLabel = new Text("Capsule", { fontSize: 0.28, anchor: CENTER });
        capLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        capLabel.move([-4.0, row2D_1_LabelY, 0]);
        this.add(capLabel);

        // 3. Teardrop (Water droplet / Map marker)
        const teardrop = new Teardrop({ radius: 0.8, tailLength: 1.7, angle: 0 });
        teardrop.paint.fill = new Color(0.2, 0.65, 1.0, 0.35); // Azure Blue
        teardrop.paint.stroke = new Color(0.3, 0.75, 1.0, 1.0);
        teardrop.paint.strokeWidth = 0.06;
        teardrop.move([0.0, row2D_1_Y, 0]);
        this.add(teardrop);

        const tearLabel = new Text("Teardrop", { fontSize: 0.28, anchor: CENTER });
        tearLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        tearLabel.move([0.0, row2D_1_LabelY, 0]);
        this.add(tearLabel);

        // 4. Annulus (Washer ring with compound bore cutout)
        const annulus = new Annulus({ innerRadius: 0.6, outerRadius: 1.15 });
        annulus.paint.fill = new Color(0.65, 0.35, 1.0, 0.35); // Violet
        annulus.paint.stroke = new Color(0.75, 0.45, 1.0, 1.0);
        annulus.paint.strokeWidth = 0.06;
        annulus.move([4.0, row2D_1_Y, 0]);
        this.add(annulus);

        const annulusLabel = new Text("Annulus", { fontSize: 0.28, anchor: CENTER });
        annulusLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        annulusLabel.move([4.0, row2D_1_LabelY, 0]);
        this.add(annulusLabel);

        // 5. Sector (Circular pie wedge)
        const sector = new Sector({ radius: 1.25, startAngle: -Math.PI / 4, endAngle: Math.PI * 0.75 });
        sector.paint.fill = new Color(0.2, 0.85, 0.55, 0.35); // Mint Emerald
        sector.paint.stroke = new Color(0.25, 0.95, 0.65, 1.0);
        sector.paint.strokeWidth = 0.06;
        sector.move([8.0, row2D_1_Y, 0]);
        this.add(sector);

        const sectorLabel = new Text("Sector", { fontSize: 0.28, anchor: CENTER });
        sectorLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        sectorLabel.move([8.0, row2D_1_LabelY, 0]);
        this.add(sectorLabel);

        // =====================================================================
        // SECTION 2: 2D SHAPES - ROW 2 (Flow, Technical & Architectural)
        // =====================================================================
        const row2D_2_Y = 1.8;
        const row2D_2_LabelY = 0.2;

        // 6. Spiral2D (Archimedean spiral ribbon)
        const spiral = new Spiral2D({ turns: 2.5, a: 0.15, b: 0.18, thickness: 0.12 });
        spiral.paint.fill = new Color(0.95, 0.25, 0.65, 0.4); // Electric Magenta
        spiral.paint.stroke = new Color(1.0, 0.35, 0.75, 1.0);
        spiral.paint.strokeWidth = 0.04;
        spiral.move([-8.0, row2D_2_Y, 0]);
        this.add(spiral);

        const spiralLabel = new Text("Spiral2D", { fontSize: 0.28, anchor: CENTER });
        spiralLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        spiralLabel.move([-8.0, row2D_2_LabelY, 0]);
        this.add(spiralLabel);

        // 7. CurvedArrow (Sweeping arc arrow with tangent-aligned arrowhead)
        const curvedArrow = new CurvedArrow({
            radius: 1.1,
            startAngle: -Math.PI * 0.7,
            endAngle: Math.PI * 0.5,
            headLength: 0.45,
            headWidth: 0.4,
            endHead: true
        });
        curvedArrow.paint.fill = new Color(1.0, 0.5, 0.2, 0.9); // Coral Orange
        curvedArrow.paint.stroke = new Color(1.0, 0.65, 0.3, 1.0);
        curvedArrow.paint.strokeWidth = 0.08;
        curvedArrow.move([-4.0, row2D_2_Y, 0]);
        this.add(curvedArrow);

        const cArrowLabel = new Text("CurvedArrow", { fontSize: 0.28, anchor: CENTER });
        cArrowLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        cArrowLabel.move([-4.0, row2D_2_LabelY, 0]);
        this.add(cArrowLabel);

        // 8. DoubleArrow (Bidirectional dimension arrow)
        const doubleArrow = new DoubleArrow([-1.2, 0], [1.2, 0], {
            headLength: 0.4,
            headWidth: 0.35
        });
        doubleArrow.paint.fill = new Color(0.98, 0.85, 0.15, 0.9); // Sunburst Gold
        doubleArrow.paint.stroke = new Color(1.0, 0.9, 0.25, 1.0);
        doubleArrow.paint.strokeWidth = 0.08;
        doubleArrow.move([0.0, row2D_2_Y, 0]);
        this.add(doubleArrow);

        const dArrowLabel = new Text("DoubleArrow", { fontSize: 0.28, anchor: CENTER });
        dArrowLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        dArrowLabel.move([0.0, row2D_2_LabelY, 0]);
        this.add(dArrowLabel);

        // 9. Waveform2D (Periodic harmonic sine wave)
        const waveform = new Waveform2D({
            waveformType: "sine",
            width: 2.4,
            amplitude: 0.65,
            cycles: 3,
            samples: 120
        });
        waveform.paint.fill = new Color(0, 0, 0, 0);
        waveform.paint.stroke = new Color(0.15, 0.9, 0.95, 1.0); // Neon Cyan
        waveform.paint.strokeWidth = 0.08;
        waveform.move([4.0, row2D_2_Y, 0]);
        this.add(waveform);

        const waveLabel = new Text("Waveform2D", { fontSize: 0.28, anchor: CENTER });
        waveLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        waveLabel.move([4.0, row2D_2_LabelY, 0]);
        this.add(waveLabel);

        // 10. ArchitecturalProfile (Structural I-Beam profile with web and flanges)
        const profile = new ArchitecturalProfile({
            profileType: "I",
            width: 1.8,
            height: 2.1,
            flangeThickness: 0.3,
            webThickness: 0.22,
            filletRadius: 0.08
        });
        profile.paint.fill = new Color(0.45, 0.85, 0.2, 0.35); // Spring Lime
        profile.paint.stroke = new Color(0.55, 0.95, 0.3, 1.0);
        profile.paint.strokeWidth = 0.06;
        profile.move([8.0, row2D_2_Y, 0]);
        this.add(profile);

        const profileLabel = new Text("Architecture (I-Beam)", { fontSize: 0.26, anchor: CENTER });
        profileLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        profileLabel.move([8.0, row2D_2_LabelY, 0]);
        this.add(profileLabel);

        // =====================================================================
        // SECTION 3: 3D SHAPES - ROW 3 (Procedural PBR Meshes)
        // =====================================================================
        const row3D_1_Y = -2.4;
        const row3D_1_LabelY = -4.0;

        // 1. Prism 3D (Hexagonal regular prism)
        const prism = new Prism3D({ sides: 6, radius: 0.85, height: 1.5 });
        prism.material.color = new Color(0.2, 0.8, 1.0, 1.0); // Electric Cyan
        prism.material.roughness = 0.25;
        prism.material.metallic = 0.85;
        prism.move([-8.0, row3D_1_Y, 0]);
        prism.transform.rotateWorldX(Math.PI / 6);
        this.add(prism);

        const prismLabel = new Text("Prism3D", { fontSize: 0.28, anchor: CENTER });
        prismLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        prismLabel.move([-8.0, row3D_1_LabelY, 0]);
        this.add(prismLabel);

        // 2. Pyramid 3D (Square pyramid)
        const pyramid = new Pyramid3D({ sides: 4, baseRadius: 0.95, height: 1.6 });
        pyramid.material.color = new Color(0.98, 0.75, 0.15, 1.0); // Gold
        pyramid.material.roughness = 0.2;
        pyramid.material.metallic = 0.9;
        pyramid.move([-4.0, row3D_1_Y, 0]);
        pyramid.transform.rotateWorldX(Math.PI / 8);
        this.add(pyramid);

        const pyramidLabel = new Text("Pyramid3D", { fontSize: 0.28, anchor: CENTER });
        pyramidLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        pyramidLabel.move([-4.0, row3D_1_LabelY, 0]);
        this.add(pyramidLabel);

        // 3. TruncatedCone 3D (Conical Frustum)
        const frustum = new TruncatedCone3D({ radiusTop: 0.45, radiusBottom: 0.9, height: 1.5 });
        frustum.material.color = new Color(0.2, 0.9, 0.6, 1.0); // Emerald
        frustum.material.roughness = 0.25;
        frustum.material.metallic = 0.8;
        frustum.move([0.0, row3D_1_Y, 0]);
        frustum.transform.rotateWorldX(Math.PI / 6);
        this.add(frustum);

        const frustumLabel = new Text("TruncatedCone3D", { fontSize: 0.28, anchor: CENTER });
        frustumLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        frustumLabel.move([0.0, row3D_1_LabelY, 0]);
        this.add(frustumLabel);

        // 4. Tube 3D (Hollow cylindrical pipe with wall thickness)
        const tube = new Tube3D({ outerRadius: 0.85, innerRadius: 0.55, height: 1.5 });
        tube.material.color = new Color(0.95, 0.45, 0.25, 1.0); // Copper / Bronze
        tube.material.roughness = 0.3;
        tube.material.metallic = 0.85;
        tube.move([4.0, row3D_1_Y, 0]);
        tube.transform.rotateWorldX(Math.PI / 4);
        this.add(tube);

        const tubeLabel = new Text("Tube3D", { fontSize: 0.28, anchor: CENTER });
        tubeLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        tubeLabel.move([4.0, row3D_1_LabelY, 0]);
        this.add(tubeLabel);

        // 5. Ellipsoid 3D (Triaxial smooth surface)
        const ellipsoid = new Ellipsoid3D({ radiusX: 0.95, radiusY: 0.65, radiusZ: 0.75 });
        ellipsoid.material.color = new Color(0.9, 0.25, 0.5, 1.0); // Ruby Rose
        ellipsoid.material.roughness = 0.2;
        ellipsoid.material.metallic = 0.85;
        ellipsoid.move([8.0, row3D_1_Y, 0]);
        ellipsoid.transform.rotateWorldX(Math.PI / 5);
        this.add(ellipsoid);

        const ellipLabel = new Text("Ellipsoid3D", { fontSize: 0.28, anchor: CENTER });
        ellipLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        ellipLabel.move([8.0, row3D_1_LabelY, 0]);
        this.add(ellipLabel);

        // =====================================================================
        // SECTION 4: 3D SHAPES - ROW 4 (Mechanical Wedge & Platonic Polyhedra)
        // =====================================================================
        const row3D_2_Y = -5.6;
        const row3D_2_LabelY = -7.2;

        // 6. Wedge 3D (Right-angled inclined ramp)
        const wedge = new Wedge3D({ width: 1.4, height: 1.1, depth: 1.2 });
        wedge.material.color = new Color(0.5, 0.6, 0.7, 1.0); // Titanium Slate
        wedge.material.roughness = 0.35;
        wedge.material.metallic = 0.75;
        wedge.move([-6.0, row3D_2_Y, 0]);
        wedge.transform.rotateWorldY(Math.PI / 4);
        wedge.transform.rotateWorldX(Math.PI / 8);
        this.add(wedge);

        const wedgeLabel = new Text("Wedge3D", { fontSize: 0.28, anchor: CENTER });
        wedgeLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        wedgeLabel.move([-6.0, row3D_2_LabelY, 0]);
        this.add(wedgeLabel);

        // 7. Dodecahedron (12 regular pentagonal faces)
        const dodeca = new Dodecahedron(0.9);
        dodeca.material.color = new Color(0.65, 0.35, 0.95, 1.0); // Royal Amethyst
        dodeca.material.roughness = 0.2;
        dodeca.material.metallic = 0.85;
        dodeca.move([-2.0, row3D_2_Y, 0]);
        this.add(dodeca);

        const dodecaLabel = new Text("Dodecahedron", { fontSize: 0.28, anchor: CENTER });
        dodecaLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        dodecaLabel.move([-2.0, row3D_2_LabelY, 0]);
        this.add(dodecaLabel);

        // 8. Octahedron (8 equilateral triangular faces)
        const octa = new Octahedron(0.95);
        octa.material.color = new Color(0.95, 0.6, 0.15, 1.0); // Topaz Amber
        octa.material.roughness = 0.2;
        octa.material.metallic = 0.9;
        octa.move([2.0, row3D_2_Y, 0]);
        this.add(octa);

        const octaLabel = new Text("Octahedron", { fontSize: 0.28, anchor: CENTER });
        octaLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        octaLabel.move([2.0, row3D_2_LabelY, 0]);
        this.add(octaLabel);

        // 9. Tetrahedron (4 equilateral triangular faces)
        const tetra = new Tetrahedron(1.05);
        tetra.material.color = new Color(0.2, 0.55, 1.0, 1.0); // Bright Sapphire
        tetra.material.roughness = 0.25;
        tetra.material.metallic = 0.85;
        tetra.move([6.0, row3D_2_Y, 0]);
        this.add(tetra);

        const tetraLabel = new Text("Tetrahedron", { fontSize: 0.28, anchor: CENTER });
        tetraLabel.paint.fill = new Color(0.8, 0.85, 0.9, 1.0);
        tetraLabel.move([6.0, row3D_2_LabelY, 0]);
        this.add(tetraLabel);

        frameContent(this, [...this.entities], 0.18);

        // =====================================================================
        // Continuous Rotations & Micro-animations
        // =====================================================================
        this.always((_t, dt) => {
            const rotSpeed = dt * 0.0012;

            // Subtle rotation for 2D spiral
            spiral.transform.rotateWorldZ(rotSpeed * 0.5);

            // Continuous aesthetic rotations for 3D meshes
            prism.transform.rotateWorldY(rotSpeed);
            pyramid.transform.rotateWorldY(rotSpeed * 0.9);
            frustum.transform.rotateWorldY(rotSpeed * 1.1);
            tube.transform.rotateWorldY(rotSpeed * 0.8);
            tube.transform.rotateWorldZ(rotSpeed * 0.4);
            ellipsoid.transform.rotateWorldY(rotSpeed * 1.2);

            wedge.transform.rotateWorldY(rotSpeed * 0.7);
            dodeca.transform.rotateWorldY(rotSpeed * 0.9);
            dodeca.transform.rotateWorldX(rotSpeed * 0.5);
            octa.transform.rotateWorldY(rotSpeed * 1.1);
            octa.transform.rotateWorldZ(rotSpeed * 0.4);
            tetra.transform.rotateWorldY(rotSpeed);
            tetra.transform.rotateWorldX(rotSpeed * 0.6);
        });
    }
}
