// =========================================================================
// File: examples/demos/instancing/instanced_interactive_picking.ts
// =========================================================================

import {
    Scene,
    OrbitCameraController,
    InteractionManager,
    Instanced,
    Model,
    Math3D,
    Vec3,
    Quaternion,
    Color,
    RaycastHit
} from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Instanced Interactive Picking & Raycasting Showcase
 *
 * Demonstrates per-instance Raycasting (IRaycastable) on an Instanced entity using setEvent().
 * Hovering over individual instances scales and illuminates them, while clicking
 * toggles their selection state.
 */
export default class InstancedInteractivePickingScene extends Scene {
    private instancedGrid!: Instanced;
    private selectedIndices: Set<number> = new Set();
    private hoveredIndex: number = -1;
    private readonly GRID_SIZE = 15;
    private readonly SPACING = 2.2;

    public async run() {
        // 1. Dark ambient background & Camera setup
        this.clearColor(demoBackground());
        this.camera.position.set([0, 22, 38]);
        new OrbitCameraController(this, this.camera, { radius: 120 });

        // 2. Enable Retiam Interaction Manager
        new InteractionManager(this);

        // 3. Create template 3D rounded cube mesh
        const template = new Model(Math3D.createCube(1.2));
        template.material.roughness = 0.25;
        template.material.metallic = 0.15;

        // 4. Create Instanced Entity
        const totalCount = this.GRID_SIZE * this.GRID_SIZE;
        this.instancedGrid = new Instanced(template, totalCount, {
            hitRadius: 0.9
        });
        this.add(this.instancedGrid);

        // 5. Layout instances in an even centered grid
        const halfSpan = (this.GRID_SIZE - 1) * this.SPACING * 0.5;
        const baseColors: Color[] = [];

        for (let gx = 0; gx < this.GRID_SIZE; gx++) {
            for (let gz = 0; gz < this.GRID_SIZE; gz++) {
                const index = gx * this.GRID_SIZE + gz;
                const x = gx * this.SPACING - halfSpan;
                const z = gz * this.SPACING - halfSpan;
                const y = Math.sin(gx * 0.4) * Math.cos(gz * 0.4) * 0.8;

                this.instancedGrid.setInstancePosition(index, new Vec3(x, y, z));
                this.instancedGrid.setInstanceRotation(index, Quaternion.identity());
                this.instancedGrid.setInstanceScale(index, 1.0);

                // Subtle blue-teal gradient
                const u = gx / (this.GRID_SIZE - 1);
                const v = gz / (this.GRID_SIZE - 1);
                const col = new Color(0.1 + u * 0.2, 0.4 + v * 0.4, 0.7 + (1 - u) * 0.3, 0.9);
                baseColors.push(col);
                this.instancedGrid.setInstanceColor(index, col);
            }
        }
        this.instancedGrid.updateInstances();

        // 6. Visual update helper
        const updateInstanceVisuals = (index: number) => {
            const isSelected = this.selectedIndices.has(index);
            const isHovered = this.hoveredIndex === index;

            if (isSelected) {
                // Bright gold / amber
                this.instancedGrid.setInstanceColor(index, new Color(1.0, 0.75, 0.1, 1.0));
                this.instancedGrid.setInstanceScale(index, isHovered ? 1.45 : 1.3);
            } else if (isHovered) {
                // Glowing cyan
                this.instancedGrid.setInstanceColor(index, new Color(0.2, 0.95, 1.0, 1.0));
                this.instancedGrid.setInstanceScale(index, 1.25);
            } else {
                // Restore base color & normal scale
                this.instancedGrid.setInstanceColor(index, baseColors[index]);
                this.instancedGrid.setInstanceScale(index, 1.0);
            }
        };

        // 7. Register standard entity events via setEvent()
        this.instancedGrid
            .setEvent("pointermove", (_e: PointerEvent, hit: RaycastHit) => {
                const newHover = (hit && hit.instanceId !== undefined) ? hit.instanceId : -1;
                if (newHover !== this.hoveredIndex) {
                    const prev = this.hoveredIndex;
                    this.hoveredIndex = newHover;
                    if (prev >= 0) updateInstanceVisuals(prev);
                    if (newHover >= 0) updateInstanceVisuals(newHover);
                    this.instancedGrid.updateInstances();
                }
            })
            .setEvent("pointerout", () => {
                if (this.hoveredIndex >= 0) {
                    const prev = this.hoveredIndex;
                    this.hoveredIndex = -1;
                    updateInstanceVisuals(prev);
                    this.instancedGrid.updateInstances();
                }
            })
            .setEvent("pointerdown", (_e: PointerEvent, hit: RaycastHit) => {
                if (hit && hit.instanceId !== undefined) {
                    const idx = hit.instanceId;
                    if (this.selectedIndices.has(idx)) {
                        this.selectedIndices.delete(idx);
                    } else {
                        this.selectedIndices.add(idx);
                    }
                    updateInstanceVisuals(idx);
                    this.instancedGrid.updateInstances();
                }
            });

        // 8. Ambient floating idle motion
        this.always((time: number) => {
            const t = time * 0.0015;
            for (let i = 0; i < totalCount; i++) {
                if (this.selectedIndices.has(i) || i === this.hoveredIndex) continue;
                const gx = Math.floor(i / this.GRID_SIZE);
                const gz = i % this.GRID_SIZE;
                const wave = Math.sin(t * 2.0 + (gx + gz) * 0.5) * 0.25;
                const pos = this.instancedGrid.getInstancePosition(i);
                pos.y = wave;
                this.instancedGrid.setInstancePosition(i, pos);
            }
            this.instancedGrid.updateInstances();
        });
    }
}
