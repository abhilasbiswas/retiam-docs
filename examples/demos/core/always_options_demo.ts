// File: examples/demos/core/always_options_demo.ts

import {
    Scene,
    Color,
    Circle,
    Line,
    AlwaysHandle
} from "retiam";
import { Camera2DController } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class AlwaysOptionsDemoScene extends Scene {
    private controller!: Camera2DController;
    private uiContainer: HTMLElement | null = null;

    // Pod 1: Orbit & Phase Entities
    private orbitCenter!: Circle;
    private satellite!: Circle;
    private preTracker!: Circle;
    private postTracker!: Circle;
    private lagLine!: Line;
    private satelliteHandle!: AlwaysHandle;

    // Pod 2: Multi-Frequency Rings
    private ring60!: Circle;
    private ring10!: Circle;
    private ring2!: Circle;
    private tick60Count: number = 0;
    private tick10Count: number = 0;
    private tick2Count: number = 0;

    // Pod 3: Reactive & Lifecycle Entities
    private beacon!: Circle;
    private beaconHandle: AlwaysHandle | null = null;
    private shockwaveRing!: Circle;
    private comet!: Circle;

    // Telemetry & Control State
    private satelliteAngle: number = 0;
    private satelliteRadius: number = 140;
    private satelliteSpeed: number = 0.0022;
    private isOrbitPaused: boolean = false;
    private lagDistance: number = 0;
    private abortCtrl: AbortController = new AbortController();

    public async run() {
        // 1. Camera & Viewport setup
        this.camera.position.set([0, 0, 1000]);
        this.controller = new Camera2DController(this, this.camera, {
            damping: 10,
            zoomSpeed: 0.8
        });
        this.clearColor(demoBackground());

        // 2. Build Pod 1: Orbital Phase System (Pre vs Post lag demonstration)
        this.setupPhasePod();

        // 3. Build Pod 2: Multi-Frequency Rate Rings (Interval & dt accumulation demonstration)
        this.setupIntervalPod();

        // 4. Build Pod 3: Lifecycle, Duration, Times & Delay Entities
        this.setupLifecyclePod();

        // 5. Mount Glassmorphism HUD Deck
        this.mountUI();

        // 6. Scene-level update pipelines:
        // A. Continuous frame invalidation
        this.always(() => {
            this.invalidate();
        });

        // B. Telemetry stats update throttled to 100ms (10 Hz) instead of burning CPU every frame
        this.always(() => {
            this.updateTelemetryUI();
        }, { interval: 100 });
    }

    private setupPhasePod() {
        const podX = -320;
        const podY = 40;

        // Central Planet / Core
        this.orbitCenter = new Circle(28);
        this.orbitCenter.paint.fill = new Color(0.12, 0.35, 0.85, 0.85);
        this.orbitCenter.paint.stroke = new Color(0.4, 0.7, 1.0, 0.9);
        this.orbitCenter.paint.strokeWidth = 3.0;
        this.orbitCenter.move([podX, podY, 0]);
        this.add(this.orbitCenter);

        // Orbit Guide Track
        const orbitGuide = new Circle(this.satelliteRadius);
        orbitGuide.paint.fill = new Color(0, 0, 0, 0);
        orbitGuide.paint.stroke = new Color(0.3, 0.5, 0.9, 0.18);
        orbitGuide.paint.strokeWidth = 1.5;
        orbitGuide.move([podX, podY, 0]);
        this.add(orbitGuide);

        // Satellite Entity (Moving in its own entity updater during 'update' phase)
        this.satellite = new Circle(14);
        this.satellite.paint.fill = new Color(1.0, 0.9, 0.2, 0.95);
        this.satellite.paint.stroke = new Color(1.0, 1.0, 1.0, 0.9);
        this.satellite.paint.strokeWidth = 2.0;
        this.satellite.move([podX + this.satelliteRadius, podY, 0]);
        this.add(this.satellite);

        // The Satellite's update logic: updates its own orbital position
        this.satelliteHandle = this.satellite.always((time, dt) => {
            this.satelliteAngle += dt * this.satelliteSpeed;
            const x = podX + Math.cos(this.satelliteAngle) * this.satelliteRadius;
            const y = podY + Math.sin(this.satelliteAngle) * this.satelliteRadius;
            this.satellite.move([x, y, 0]);
        }, { phase: 'update' });

        // A. Trailing Ghost Tracker with phase: 'pre'
        // Since 'pre' executes BEFORE satellite.update(), this tracker reads satellite's PREVIOUS frame position!
        this.preTracker = new Circle(10);
        this.preTracker.paint.fill = new Color(1.0, 0.2, 0.3, 0.45);
        this.preTracker.paint.stroke = new Color(1.0, 0.3, 0.4, 0.9);
        this.preTracker.paint.strokeWidth = 2.0;
        this.add(this.preTracker);

        this.always(() => {
            // Reads position before satellite has moved this frame -> 1-frame trailing lag!
            this.preTracker.move([
                this.satellite.transform.positionX,
                this.satellite.transform.positionY,
                0
            ]);
        }, { phase: 'pre' });

        // B. Precision Lock Tracker with phase: 'post'
        // Since 'post' executes AFTER satellite.update(), this tracker reads satellite's FRESH position -> 0 lag!
        this.postTracker = new Circle(18);
        this.postTracker.paint.fill = new Color(0, 0, 0, 0);
        this.postTracker.paint.stroke = new Color(0.0, 0.95, 0.8, 0.95);
        this.postTracker.paint.strokeWidth = 2.5;
        this.add(this.postTracker);

        // Vector line indicating phase delta gap
        this.lagLine = new Line([[0, 0], [0, 0]], {
            stroke: new Color(1.0, 0.3, 0.4, 0.85),
            strokeWidth: 2.0
        });
        this.add(this.lagLine);

        this.always(() => {
            // Reads position after satellite moved this frame -> exactly synchronized!
            this.postTracker.move([
                this.satellite.transform.positionX,
                this.satellite.transform.positionY,
                0
            ]);

            // Calculate lag distance between pre (stale) and post (fresh)
            const dx = this.postTracker.transform.positionX - this.preTracker.transform.positionX;
            const dy = this.postTracker.transform.positionY - this.preTracker.transform.positionY;
            this.lagDistance = Math.sqrt(dx * dx + dy * dy);

            // Update gap visualization line
            this.lagLine.setVertices([
                [this.preTracker.transform.positionX, this.preTracker.transform.positionY],
                [this.postTracker.transform.positionX, this.postTracker.transform.positionY]
            ]);
        }, { phase: 'post' });
    }

    private setupIntervalPod() {
        const podX = 30;
        const podY = 40;

        // Top Ring: 60 FPS (Raw Frame Rate, smooth unthrottled)
        this.ring60 = new Circle(48);
        this.ring60.paint.fill = new Color(0, 0, 0, 0);
        this.ring60.paint.stroke = new Color(0.0, 0.85, 1.0, 0.85);
        this.ring60.paint.strokeWidth = 3.5;
        this.ring60.move([podX, podY + 110, 0]);
        this.add(this.ring60);

        let angle60 = 0;
        this.always((time, dt) => {
            this.tick60Count++;
            angle60 += dt * 0.003;
            const scale = 1.0 + Math.sin(angle60 * 3) * 0.12;
            this.ring60.transform.scaling = scale;
        });

        // Middle Ring: 10 FPS (interval: 100ms, retro stepped rotation, accumulated dt!)
        this.ring10 = new Circle(48);
        this.ring10.paint.fill = new Color(0, 0, 0, 0);
        this.ring10.paint.stroke = new Color(1.0, 0.8, 0.2, 0.9);
        this.ring10.paint.strokeWidth = 3.5;
        this.ring10.move([podX, podY, 0]);
        this.add(this.ring10);

        let angle10 = 0;
        this.always((time, dt) => {
            this.tick10Count++;
            // dt is accumulated (~100ms), so step angle jumps cleanly by the accurate elapsed amount!
            angle10 += dt * 0.003;
            const scale = 1.0 + Math.sin(angle10 * 3) * 0.12;
            this.ring10.transform.scaling = scale;
        }, { interval: 100 });

        // Bottom Ring: 2 FPS (interval: 500ms, pulsed strobe heartbeat)
        this.ring2 = new Circle(48);
        this.ring2.paint.fill = new Color(0, 0, 0, 0);
        this.ring2.paint.stroke = new Color(0.85, 0.3, 1.0, 0.9);
        this.ring2.paint.strokeWidth = 3.5;
        this.ring2.move([podX, podY - 110, 0]);
        this.add(this.ring2);

        let toggle2 = false;
        this.always((time, dt) => {
            this.tick2Count++;
            toggle2 = !toggle2;
            const scale = toggle2 ? 1.25 : 0.85;
            this.ring2.transform.scaling = scale;
            this.ring2.paint.stroke = toggle2
                ? new Color(1.0, 0.4, 0.9, 1.0)
                : new Color(0.5, 0.2, 0.8, 0.5);
        }, { interval: 500 });
    }

    private setupLifecyclePod() {
        const podX = 360;
        const podY = 40;

        // 1. Beacon Entity (Times & Interval demonstration)
        this.beacon = new Circle(32);
        this.beacon.paint.fill = new Color(0.15, 0.18, 0.25, 0.8);
        this.beacon.paint.stroke = new Color(0.4, 0.5, 0.65, 0.9);
        this.beacon.paint.strokeWidth = 3.0;
        this.beacon.move([podX, podY + 110, 0]);
        this.add(this.beacon);

        // Initial burst: flash 8 times then auto-stop
        this.triggerBeaconBurst();

        // 2. Expanding Shockwave (Duration demonstration)
        this.shockwaveRing = new Circle(10);
        this.shockwaveRing.paint.fill = new Color(0, 0, 0, 0);
        this.shockwaveRing.paint.stroke = new Color(0.1, 0.9, 0.6, 0.8);
        this.shockwaveRing.paint.strokeWidth = 2.5;
        this.shockwaveRing.move([podX, podY, 0]);
        this.add(this.shockwaveRing);

        this.triggerShockwave();

        // 3. Delayed Comet (Delay demonstration)
        this.comet = new Circle(16);
        this.comet.paint.fill = new Color(1.0, 0.45, 0.15, 0.9);
        this.comet.paint.stroke = new Color(1.0, 0.85, 0.4, 0.9);
        this.comet.paint.strokeWidth = 2.0;
        this.comet.move([podX - 80, podY - 110, 0]);
        this.add(this.comet);

        this.triggerDelayedComet();
    }

    public triggerBeaconBurst() {
        if (this.beaconHandle && this.beaconHandle.isRunning) {
            this.beaconHandle.stop();
        }

        let flash = false;
        this.beacon.paint.stroke = new Color(0.0, 0.9, 1.0, 1.0);

        // times: 8 with interval: 120ms -> Flashes exactly 8 times then unregisters automatically!
        this.beaconHandle = this.beacon.always((time, dt, ctx) => {
            flash = !flash;
            this.beacon.paint.fill = flash
                ? new Color(0.0, 0.8, 1.0, 0.95)
                : new Color(0.05, 0.2, 0.4, 0.6);
            this.beacon.transform.scaling = flash ? 1.2 : 0.95;

            // When finished (on last tick), turn dormant
            if (ctx.count === 8) {
                setTimeout(() => {
                    this.beacon.paint.fill = new Color(0.15, 0.18, 0.25, 0.8);
                    this.beacon.paint.stroke = new Color(0.4, 0.5, 0.65, 0.6);
                    this.beacon.transform.scaling = 1.0;
                }, 120);
            }
        }, { interval: 120, times: 8 });
    }

    public triggerShockwave() {
        let radius = 10;

        // duration: 2200ms -> Expands and fades, then auto-stops!
        this.always((time, dt, ctx) => {
            radius += dt * 0.045;
            const progress = ctx.elapsed / 2200;
            const opacity = Math.max(0, 1.0 - progress);

            this.shockwaveRing.transform.scaling = radius / 10;
            this.shockwaveRing.paint.stroke = new Color(0.1, 0.9, 0.6, opacity * 0.9);

            // Loop smoothly when finished
            if (ctx.elapsed >= 2200) {
                this.triggerShockwave();
            }
        }, { duration: 2200 });
    }

    public triggerDelayedComet() {
        const podX = 360;
        const podY = 40;
        const startX = podX - 80;
        const endX = podX + 80;
        this.comet.move([startX, podY - 110, 0]);

        // delay: 800ms, duration: 1600ms -> Waits 800ms before starting, then slides across for 1.6s!
        this.always((time, dt, ctx) => {
            const progress = ctx.elapsed / 1600;
            const currentX = startX + (endX - startX) * progress;
            this.comet.move([currentX, podY - 110, 0]);

            if (ctx.elapsed >= 1600) {
                // Loop with delay
                this.triggerDelayedComet();
            }
        }, { delay: 800, duration: 1600 });
    }

    public triggerScreenShake(durationMs: number = 1500) {
        const origX = this.camera.position.x;
        const origY = this.camera.position.y;

        // duration: 1500ms screen shake with quadratic falloff
        this.always((time, dt, ctx) => {
            const remaining = 1.0 - (ctx.elapsed / durationMs);
            const intensity = 8.0 * remaining * remaining;

            this.camera.position.x = origX + (Math.random() - 0.5) * intensity;
            this.camera.position.y = origY + (Math.random() - 0.5) * intensity;

            if (ctx.elapsed >= durationMs) {
                this.camera.position.x = origX;
                this.camera.position.y = origY;
            }
        }, { duration: durationMs });
    }

    public toggleOrbit() {
        if (this.isOrbitPaused) {
            this.satelliteHandle.resume();
            this.isOrbitPaused = false;
        } else {
            this.satelliteHandle.pause();
            this.isOrbitPaused = true;
        }
    }

    public testAbortSignal() {
        this.abortCtrl.abort();
        this.abortCtrl = new AbortController();

        // Spawn a task governed by AbortSignal
        let pulse = 0;
        this.always((time, dt) => {
            pulse += dt * 0.005;
            this.orbitCenter.paint.strokeWidth = 3.0 + Math.sin(pulse) * 2.0;
        }, { signal: this.abortCtrl.signal });
    }

    // =========================================================================
    // UI DASHBOARD & GLASSMORPHISM HUD
    // =========================================================================

    private mountUI() {
        if (typeof document === "undefined") return;

        const existing = document.getElementById("always-demo-ui");
        if (existing) existing.remove();

        const container = document.createElement("div");
        container.id = "always-demo-ui";
        container.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 100;
            width: 330px;
            background: rgba(10, 14, 26, 0.88);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            padding: 18px;
            color: #eceff4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
            user-select: none;
        `;

        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #00f0ff; letter-spacing: -0.2px;">always() Lifecycle Engine</h2>
                    <p style="margin: 2px 0 0; font-size: 11px; color: #8892b0;">Phases • Intervals • Lifecycle Handles</p>
                </div>
                <span id="badge-active" style="background: rgba(0, 240, 255, 0.15); border: 1px solid rgba(0, 240, 255, 0.4); color: #00f0ff; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;">Active</span>
            </div>

            <!-- Telemetry Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <div>
                    <span style="font-size: 10px; color: #8892b0; text-transform: uppercase;">Phase Lag Gap</span>
                    <div id="stat-lag" style="font-size: 13px; font-weight: 600; color: #ff5252; margin-top: 2px;">0.0 px</div>
                </div>
                <div>
                    <span style="font-size: 10px; color: #8892b0; text-transform: uppercase;">60 Hz vs 10 Hz</span>
                    <div id="stat-ticks" style="font-size: 13px; font-weight: 600; color: #ffd700; margin-top: 2px;">0 / 0</div>
                </div>
                <div>
                    <span style="font-size: 10px; color: #8892b0; text-transform: uppercase;">2 Hz Pulse</span>
                    <div id="stat-pulse" style="font-size: 13px; font-weight: 600; color: #d052ff; margin-top: 2px;">0 ticks</div>
                </div>
                <div>
                    <span style="font-size: 10px; color: #8892b0; text-transform: uppercase;">Orbit State</span>
                    <div id="stat-orbit" style="font-size: 13px; font-weight: 600; color: #00e676; margin-top: 2px;">Running</div>
                </div>
            </div>

            <!-- Pod Legends -->
            <div style="margin-bottom: 14px; font-size: 11px; line-height: 1.5; color: #b0b8c8;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00f0ff;"></span>
                    <span><b>Pod 1 (Left)</b>: <span style="color: #ff5252;">Pre (Lag)</span> vs <span style="color: #00e676;">Post (0 Lag)</span></span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ffd700;"></span>
                    <span><b>Pod 2 (Center)</b>: 60 Hz • 10 Hz • 2 Hz Intervals</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #d052ff;"></span>
                    <span><b>Pod 3 (Right)</b>: Times(8) • Duration(2.2s) • Delay(0.8s)</span>
                </div>
            </div>

            <!-- Control Actions -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; gap: 6px;">
                    <button id="btn-pause-orbit" style="flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(0, 240, 255, 0.4); background: rgba(0, 240, 255, 0.1); color: #00f0ff; font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.2s;">⏸ Pause Orbit</button>
                    <button id="btn-beacon" style="flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(255, 215, 0, 0.4); background: rgba(255, 215, 0, 0.1); color: #ffd700; font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.2s;">⚡ 8-Tick Flash</button>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button id="btn-shake" style="flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(255, 82, 82, 0.4); background: rgba(255, 82, 82, 0.1); color: #ff5252; font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.2s;">💥 1.5s Shake</button>
                    <button id="btn-abort" style="flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(208, 82, 255, 0.4); background: rgba(208, 82, 255, 0.1); color: #d052ff; font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.2s;">🚫 Abort Signal</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.uiContainer = container;

        // Bind interactive buttons
        const btnPause = container.querySelector<HTMLButtonElement>("#btn-pause-orbit");
        btnPause?.addEventListener("click", () => {
            this.toggleOrbit();
            btnPause.textContent = this.isOrbitPaused ? "▶ Resume Orbit" : "⏸ Pause Orbit";
            btnPause.style.background = this.isOrbitPaused
                ? "rgba(0, 230, 118, 0.15)"
                : "rgba(0, 240, 255, 0.1)";
            btnPause.style.borderColor = this.isOrbitPaused
                ? "rgba(0, 230, 118, 0.4)"
                : "rgba(0, 240, 255, 0.4)";
            btnPause.style.color = this.isOrbitPaused ? "#00e676" : "#00f0ff";
        });

        const btnBeacon = container.querySelector<HTMLButtonElement>("#btn-beacon");
        btnBeacon?.addEventListener("click", () => {
            this.triggerBeaconBurst();
        });

        const btnShake = container.querySelector<HTMLButtonElement>("#btn-shake");
        btnShake?.addEventListener("click", () => {
            this.triggerScreenShake(1500);
        });

        const btnAbort = container.querySelector<HTMLButtonElement>("#btn-abort");
        btnAbort?.addEventListener("click", () => {
            this.testAbortSignal();
            btnAbort.textContent = "✓ Signal Aborted";
            setTimeout(() => {
                if (btnAbort) btnAbort.textContent = "🚫 Abort Signal";
            }, 1200);
        });
    }

    private updateTelemetryUI() {
        if (!this.uiContainer) return;

        const statLag = this.uiContainer.querySelector("#stat-lag");
        if (statLag) {
            statLag.textContent = `${this.lagDistance.toFixed(1)} px (1-frame)`;
        }

        const statTicks = this.uiContainer.querySelector("#stat-ticks");
        if (statTicks) {
            statTicks.textContent = `${this.tick60Count} / ${this.tick10Count}`;
        }

        const statPulse = this.uiContainer.querySelector("#stat-pulse");
        if (statPulse) {
            statPulse.textContent = `${this.tick2Count} ticks`;
        }

        const statOrbit = this.uiContainer.querySelector<HTMLElement>("#stat-orbit");
        if (statOrbit) {
            statOrbit.textContent = this.isOrbitPaused ? "Paused" : "Running (140 px/r)";
            statOrbit.style.color = this.isOrbitPaused ? "#ffd700" : "#00e676";
        }
    }
}
