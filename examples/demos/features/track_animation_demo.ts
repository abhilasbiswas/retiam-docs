// =========================================================================
// File: examples/demos/features/track_animation_demo.ts
//
// Showcase scene for TrackBuilder and custom Entity animation orchestration.
// Demonstrates defining an entity-level createAnim(t: TrackBuilder) hook,
// sequencing parallel steps, series steps, and temporal pauses (.wait),
// and playing the composite entity with scene.play(new Create(entity)).
// =========================================================================

import {
    CENTER,
    Scene,
    Entity,
    Color,
    Text,
    Circle,
    Rect,
    Line,
    Vec3,
    Rate,
    Create,
    Write,
    FadeIn,
    TrackBuilder,
    CameraController,
    CameraModel
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

// -------------------------------------------------------------------------
// Custom Composite Entity: TelemetryCard
// -------------------------------------------------------------------------

export interface TelemetryCardConfig {
    title: string;
    badgeText: string;
    metricValue: string;
    metricLabel: string;
    subtext: string;
    points: [number, number][];
    themeColor: Color;
    accentColor: Color;
}

const DEFAULT_CARD_CONFIG: TelemetryCardConfig = {
    title: "CORE TELEMETRY",
    badgeText: "ONLINE",
    metricValue: "99.98%",
    metricLabel: "CLUSTER EFFICIENCY",
    subtext: "LATENCY: 1.2ms  •  480K OPS/SEC",
    points: [
        [-2.4, -0.55],
        [-1.7, -0.15],
        [-1.0, -0.45],
        [-0.3, 0.35],
        [0.4, -0.1],
        [1.1, 0.55],
        [1.8, 0.25],
        [2.4, 0.65]
    ],
    themeColor: new Color(0.18, 0.85, 1.0, 1.0),
    accentColor: new Color(0.1, 0.95, 0.6, 1.0)
};

/**
 * A sleek, modern HUD dashboard card built from multiple vector primitives.
 * Implements createAnim(t: TrackBuilder) to declare its own multi-stage
 * entrance choreography.
 */
export class TelemetryCard extends Entity {
    public frame: Rect;
    public beacon: Circle;
    public titleText: Text;
    public badgeRect: Rect;
    public badgeText: Text;
    public headerLine: Line;
    public metricValueText: Text;
    public metricLabelText: Text;
    public sparklineGrid: Line;
    public sparkline: Line;
    public footerLine: Line;
    public footerSubtext: Text;

    constructor(config: Partial<TelemetryCardConfig> = {}) {
        super();
        const cfg: TelemetryCardConfig = { ...DEFAULT_CARD_CONFIG, ...config };

        // 1. Outer glassmorphic container frame
        this.frame = new Rect(5.8, 3.8, { cornerRadius: 0.25 });
        this.frame.paint.fill = new Color(0.06, 0.08, 0.14, 0.88);
        this.frame.paint.setStroke(0.04, cfg.themeColor);

        // 2. Status beacon / pulse indicator
        this.beacon = new Circle(0.12);
        this.beacon.paint.fill = cfg.accentColor;
        this.beacon.transform.setPositionXYZ(-2.3, 1.3, 0);

        // 3. Header title
        this.titleText = new Text(cfg.title, { fontSize: 0.32 });
        this.titleText.paint.fill = new Color(0.92, 0.96, 1.0, 1.0);
        this.titleText.transform.setPositionXYZ(-0.7, 1.3, 0);

        // 4. Status pill / badge
        this.badgeRect = new Rect(1.2, 0.32, { cornerRadius: 0.08 });
        this.badgeRect.paint.fill = new Color(
            cfg.accentColor.r * 0.2,
            cfg.accentColor.g * 0.2,
            cfg.accentColor.b * 0.2,
            0.8
        );
        this.badgeRect.paint.setStroke(0.02, cfg.accentColor);
        this.badgeRect.transform.setPositionXYZ(2.0, 1.3, 0);

        this.badgeText = new Text(cfg.badgeText, { anchor: CENTER, fontSize: 0.2 });
        this.badgeText.paint.fill = cfg.accentColor;
        this.badgeText.transform.setPositionXYZ(2.0, 1.3, 0);

        // 5. Header divider
        this.headerLine = new Line([[-2.6, 0.95], [2.6, 0.95]], {
            stroke: new Color(0.2, 0.3, 0.45, 0.5),
            strokeWidth: 0.02
        });

        // 6. Primary metric readout
        this.metricValueText = new Text(cfg.metricValue, { fontSize: 0.72 });
        this.metricValueText.paint.fill = cfg.themeColor;
        this.metricValueText.transform.setPositionXYZ(-1.2, 0.35, 0);

        this.metricLabelText = new Text(cfg.metricLabel, { fontSize: 0.2 });
        this.metricLabelText.paint.fill = new Color(0.55, 0.65, 0.8, 1.0);
        this.metricLabelText.transform.setPositionXYZ(-1.2, -0.1, 0);

        // 7. Sparkline telemetry trendline
        this.sparklineGrid = new Line([[-2.5, -0.6], [2.5, -0.6]], {
            stroke: new Color(0.18, 0.25, 0.35, 0.4),
            strokeWidth: 0.015
        });

        this.sparkline = new Line(cfg.points, {
            stroke: cfg.accentColor,
            strokeWidth: 0.045
        });

        // 8. Footer divider & diagnostics subtext
        this.footerLine = new Line([[-2.6, -1.15], [2.6, -1.15]], {
            stroke: new Color(0.2, 0.3, 0.45, 0.5),
            strokeWidth: 0.02
        });

        this.footerSubtext = new Text(cfg.subtext, { anchor: CENTER, fontSize: 0.18 });
        this.footerSubtext.paint.fill = new Color(0.48, 0.55, 0.68, 1.0);
        this.footerSubtext.transform.setPositionXYZ(0, -1.45, 0);

        // Attach all children to this entity
        this.add(
            this.frame,
            this.beacon,
            this.titleText,
            this.badgeRect,
            this.badgeText,
            this.headerLine,
            this.metricValueText,
            this.metricLabelText,
            this.sparklineGrid,
            this.sparkline,
            this.footerLine,
            this.footerSubtext
        );
    }

    /**
     * Declares the multi-stage creation animation sequence for this entity.
     * Invoked automatically when the caller plays `new Create(this)`.
     */
    public override createAnim(t: TrackBuilder): void {
        // Stage 1: Card container backdrop & frame (smooth vector draw)
        t.add(new Create(this.frame, { duration: 600 }));

        // Stage 2: Parallel introduction of header components
        t.add(
            new Create(this.beacon, { duration: 350 }),
            new Write(this.titleText, { duration: 450 }),
            new Create(this.badgeRect, { duration: 400 }),
            new FadeIn(this.badgeText, { duration: 350 }),
            new Create(this.headerLine, { duration: 350 })
        );

        // Stage 3: Natural temporal pause between header setup and data readout
        t.wait(150);

        // Stage 4: Primary metric and graph trendline drawn together
        t.add(
            new Write(this.metricValueText, { duration: 650 }),
            new FadeIn(this.metricLabelText, { duration: 400 }),
            new Create(this.sparklineGrid, { duration: 300 }),
            new Create(this.sparkline, { duration: 750 })
        );

        // Stage 5: Subtle pause before diagnostics footer
        t.wait(100);

        // Stage 6: Divider rule & footer diagnostics reveal
        t.add(
            new Create(this.footerLine, { duration: 350 }),
            new FadeIn(this.footerSubtext, { duration: 400 })
        );
    }
}

// -------------------------------------------------------------------------
// Demo Scene
// -------------------------------------------------------------------------

export default class TrackAnimationDemo extends Scene {
    public async run() {
        // 1. Camera & sleek dark background
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.position.set([0, 0, 16]);
        this.clearColor(demoBackground());
        frameStage(this, 17, 11, 0.3);
        new CameraController(this, this.camera);

        // 2. Scene Title & Subtitle
        const title = new Text("TrackBuilder & Custom Entity Architecture", { anchor: CENTER, fontSize: 0.6 });
        title.paint.fill = new Color(1.0, 0.85, 0.3, 1.0);
        title.transform.setPositionXYZ(0, 3.4, 0);

        const subtitle = new Text(
            "Declarative multi-stage composite animation orchestrated via scene.play(new Create(entity))",
            { anchor: CENTER, fontSize: 0.24 }
        );
        subtitle.paint.fill = new Color(0.7, 0.75, 0.85, 1.0);
        subtitle.transform.setPositionXYZ(0, 2.7, 0);

        // Reveal header
        await this.play([
            new Write(title, { duration: 750 }),
            new FadeIn(subtitle, { duration: 550 })
        ]);

        await this.wait(300);

        // 3. Card 1: Core Telemetry (Runs with its natural track duration)
        const card1 = new TelemetryCard();
        card1.transform.setPositionXYZ(-3.3, -0.6, 0);

        await this.play(new Create(card1));

        await this.wait(400);

        // 4. Card 2: Quantum Flow (Runs with custom duration scaling & easing)
        const card2 = new TelemetryCard({
            title: "QUANTUM FLOW",
            badgeText: "BOOST",
            metricValue: "4.82 Tb/s",
            metricLabel: "THROUGHPUT BANDWIDTH",
            subtext: "PACKET LOSS: 0.001%  •  96 NODES",
            points: [
                [-2.4, -0.4],
                [-1.8, 0.25],
                [-1.1, -0.2],
                [-0.4, 0.45],
                [0.3, 0.05],
                [1.0, 0.65],
                [1.7, 0.35],
                [2.4, 0.75]
            ],
            themeColor: new Color(0.75, 0.4, 1.0, 1.0),
            accentColor: new Color(1.0, 0.65, 0.2, 1.0)
        });
        card2.transform.setPositionXYZ(3.3, -0.6, 0);

        // Proportional duration scaling: stretches or compresses all tracks automatically!
        await this.play(new Create(card2, {
            duration: 2200,
            rate_func: Rate.easeInOutCubic()
        }));

        await this.wait(1000);
    }
}
