// =========================================================================
// File: examples/demos/modifiers/custom_modifier_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Path,
    SDFText,
    CustomAnimation,
    Rate,
    hex,
    Color,
    Vec2,
    PathModifier,
    PathContours,
    PathContour,
    PathModifierUtils,
    ResampleModifier,
    CustomModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

// =========================================================================
// 1. REUSABLE OOP CLASS-BASED CUSTOM MODIFIER
// =========================================================================

export interface AttractorOptions {
    /** Position of the gravitational attractor point in local space. Default: (0, 0) */
    point?: Vec2;
    /** Pull strength (-1.0 to 1.0; positive pulls inward, negative repels). Default: 0.6 */
    strength?: number;
    /** Influence radius of the gravitational field. Default: 2.0 */
    radius?: number;
}

/**
 * Custom user-defined modifier that pulls or pushes path coordinates
 * toward a 2D attractor point with smooth cubic radial falloff.
 */
export class AttractorModifier extends PathModifier {
    private _point: Vec2 = new Vec2(0, 0);
    private _strength: number = 0.6;
    private _radius: number = 2.0;

    constructor(options?: AttractorOptions) {
        super("Attractor");
        if (options?.point) this._point = options.point.clone();
        if (options?.strength !== undefined) this._strength = options.strength;
        if (options?.radius !== undefined) this._radius = options.radius;
    }

    public get point(): Vec2 { return this._point; }
    public set point(val: Vec2) {
        this._point.set(val);
        this.invalidate(); // Automatically marks dirty & updates GPU buffers!
    }

    public get strength(): number { return this._strength; }
    public set strength(val: number) {
        if (this._strength !== val) {
            this._strength = val;
            this.invalidate();
        }
    }

    public get radius(): number { return this._radius; }
    public set radius(val: number) {
        if (this._radius !== val) {
            this._radius = val;
            this.invalidate();
        }
    }

    public apply(contours: PathContours): PathContours {
        if (Math.abs(this._strength) <= 1e-5 || this._radius <= 1e-5) return contours;

        const result: PathContours = [];
        const ax = this._point.x;
        const ay = this._point.y;
        const rMax = this._radius;

        for (const contour of contours) {
            if (contour.length < 4) {
                result.push(contour.slice());
                continue;
            }

            const deformed: PathContour = new Array(contour.length);

            for (let i = 0; i < contour.length; i += 2) {
                const px = contour[i];
                const py = contour[i + 1];

                const dx = ax - px;
                const dy = ay - py;
                const dist = Math.hypot(dx, dy);

                if (dist >= rMax || dist < 1e-5) {
                    deformed[i] = px;
                    deformed[i + 1] = py;
                } else {
                    // Smooth cubic falloff: max attraction at center, 0 at rMax
                    const norm = 1.0 - (dist / rMax);
                    const falloff = norm * norm;
                    const pull = this._strength * falloff;

                    deformed[i] = px + dx * pull;
                    deformed[i + 1] = py + dy * pull;
                }
            }

            result.push(deformed);
        }

        return result;
    }
}

// =========================================================================
// 2. DEMO SCENE: SHOWCASING BOTH FUNCTIONAL & CLASS-BASED CUSTOM MODIFIERS
// =========================================================================

export default class CustomModifierDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        // Title and Header
        const title = new SDFText("Custom Path Modifiers", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Inline CustomModifier & Reusable Class (extends PathModifier)", { anchor: CENTER, fontSize: 0.28 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // -------------------------------------------------------------
        // LEFT: Functional Inline Custom Modifier (CustomModifier)
        // -------------------------------------------------------------
        const leftCenterX = -3.2;

        const leftLabel = new SDFText("1. Inline Functional Modifier", { anchor: CENTER, fontSize: 0.32 });
        leftLabel.transform.position.set([leftCenterX, 2.3, 0]);
        leftLabel.paint.fill = hex("#38BDF8");
        this.add(leftLabel);

        const leftSub = new SDFText("new CustomModifier((contours) => ...)", { anchor: CENTER, fontSize: 0.22 });
        leftSub.transform.position.set([leftCenterX, 1.85, 0]);
        leftSub.paint.fill = hex("#64748B");
        this.add(leftSub);

        // Circular concentric target
        const circleD = "M 0 -1.8 A 1.8 1.8 0 1 1 0 1.8 A 1.8 1.8 0 1 1 0 -1.8 Z M 0 -1.1 A 1.1 1.1 0 1 1 0 1.1 A 1.1 1.1 0 1 1 0 -1.1 Z";

        let wavePhase = 0.0;
        let waveAmp = 0.18;

        const functionalPath = new Path(circleD)
            .addModifier(new ResampleModifier({ count: 64 }))
            // Authoring custom modifier via inline CustomModifier
            .addModifier(new CustomModifier((contours) => {
                return contours.map(c => {
                    const out = new Array(c.length);
                    for (let i = 0; i < c.length; i += 2) {
                        const x = c[i];
                        const y = c[i + 1];
                        const angle = Math.atan2(y, x);
                        const radius = Math.hypot(x, y);
                        // Sinusoidal flower ripple
                        const ripple = Math.sin(angle * 6 + wavePhase) * waveAmp;
                        const newR = Math.max(0.1, radius + ripple);
                        out[i] = Math.cos(angle) * newR;
                        out[i + 1] = Math.sin(angle) * newR;
                    }
                    return out;
                });
            }, "PolarWaveWarp"));

        functionalPath.paint.setStroke(0.07, hex("#38BDF8"));
        functionalPath.paint.fill = new Color(0.08, 0.25, 0.4, 0.2);
        functionalPath.transform.position.set([leftCenterX, -0.3, 0]);
        this.add(functionalPath);

        const leftStatus = new SDFText("Wave: 6-Petal Polar Warp", { anchor: CENTER, fontSize: 0.24 });
        leftStatus.transform.position.set([leftCenterX, -2.6, 0]);
        leftStatus.paint.fill = hex("#38BDF8");
        this.add(leftStatus);

        // -------------------------------------------------------------
        // RIGHT: Reusable OOP Class-Based Custom Modifier
        // -------------------------------------------------------------
        const rightCenterX = 3.2;

        const rightLabel = new SDFText("2. Reusable Class Modifier", { anchor: CENTER, fontSize: 0.32 });
        rightLabel.transform.position.set([rightCenterX, 2.3, 0]);
        rightLabel.paint.fill = hex("#C084FC");
        this.add(rightLabel);

        const rightSub = new SDFText("class AttractorModifier extends PathModifier", { anchor: CENTER, fontSize: 0.22 });
        rightSub.transform.position.set([rightCenterX, 1.85, 0]);
        rightSub.paint.fill = hex("#64748B");
        this.add(rightSub);

        // 12-point ornate star
        let starD = "";
        const starPoints = 12;
        for (let i = 0; i < starPoints * 2; i++) {
            const a = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
            const r = (i % 2 === 0) ? 1.8 : 0.9;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            starD += (i === 0 ? `M ${x.toFixed(3)} ${y.toFixed(3)}` : ` L ${x.toFixed(3)} ${y.toFixed(3)}`);
        }
        starD += " Z";

        const attractorPath = new Path(starD)
            .addModifier(new ResampleModifier({ count: 80 }))
            .addModifier(new AttractorModifier({
                point: new Vec2(0, 0),
                strength: 0.75,
                radius: 1.8
            }));

        attractorPath.paint.setStroke(0.07, hex("#C084FC"));
        attractorPath.paint.fill = new Color(0.3, 0.1, 0.45, 0.2);
        attractorPath.transform.position.set([rightCenterX, -0.3, 0]);
        this.add(attractorPath);

        // Orbiting gravitational marker
        const attractorMarker = new Path("M 0 -0.15 A 0.15 0.15 0 1 1 0 0.15 A 0.15 0.15 0 1 1 0 -0.15 Z");
        attractorMarker.paint.fill = hex("#F43F5E");
        attractorMarker.transform.position.set([rightCenterX, -0.3, 0]);
        this.add(attractorMarker);

        const rightStatus = new SDFText("Gravity Lens: Orbiting Attractor", { anchor: CENTER, fontSize: 0.24 });
        rightStatus.transform.position.set([rightCenterX, -2.6, 0]);
        rightStatus.paint.fill = hex("#C084FC");
        this.add(rightStatus);

        frameContent(this, [title, functionalPath, attractorPath, leftStatus, rightStatus, subtitle, leftLabel, leftSub, rightLabel, rightSub], 0.22);

        const attractorMod = attractorPath.getModifier(AttractorModifier)!;
        const currentAttractorPt = new Vec2();

        // Animate both custom modifiers simultaneously
        await this.play(new CustomAnimation((t) => {
            // 1. Update functional modifier phase & trigger pipeline evaluation
            wavePhase = t * Math.PI * 6;
            waveAmp = 0.12 + Math.sin(t * Math.PI * 4) * 0.08;
            functionalPath.invalidateModifiers();

            // 2. Animate OOP modifier attractor point in an elliptical orbit
            const orbitAngle = t * Math.PI * 4;
            const orbitX = Math.cos(orbitAngle) * 1.1;
            const orbitY = Math.sin(orbitAngle * 1.5) * 0.9;
            currentAttractorPt.set(orbitX, orbitY);
            attractorMod.point = currentAttractorPt; // Automatically triggers reactive path update!

            // Update marker position
            attractorMarker.transform.position.set([rightCenterX + orbitX, -0.3 + orbitY, 0]);
        }, { duration: 4500, rate_func: Rate.linear() }));

        await this.wait(600);
    }
}
