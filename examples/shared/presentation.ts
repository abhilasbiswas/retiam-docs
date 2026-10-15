import { Scene, CameraModel, OrbitCameraController, SDFText, Entity, AABB, CENTER, hex } from 'retiam';

/** Fresh color instances keep animated paint changes local to each scene. */
export function demoBackground() {
    return hex('#080c14');
}

/** Refit complete static content only when the viewport changes. */
export function frameContent(scene: Scene, entities: Entity | Entity[] | AABB, padding = 0.22) {
    let previousAspect = 0;
    const fit = () => {
        const aspect = scene.canvas.width / Math.max(1, scene.canvas.height);
        if (aspect === previousAspect) return;
        previousAspect = aspect;
        const frame = scene.camera.computeFrameTransform(entities, { padding, aspect });
        scene.camera.frame(entities, { padding, aspect });
        // The 2D controller caches its target and otherwise eases back to the old frame.
        const controls = scene.controls as { syncFromCamera?: () => void } | undefined;
        controls?.syncFromCamera?.();
        if (scene.controls instanceof OrbitCameraController && frame) {
            scene.controls.restoreState({
                targetCenter: frame.center,
                targetRadius: frame.distance,
                targetPitch: scene.camera.pitch,
                targetYaw: scene.camera.yaw,
                targetFocus: scene.camera.focusDist,
            });
        }
    };
    fit();
    // Refit once after scene preparation has resolved model and layout bounds.
    previousAspect = 0;
    scene.always(fit, { phase: 'pre' });
}

/** Fit a known stage once, leaving camera input alone afterwards. */
export function frameStage(scene: Scene, width: number, height: number, centerY = 0) {
    scene.clearColor(demoBackground());
    scene.camera.model = CameraModel.ORTHOGRAPHIC;
    scene.camera.lookAt(null);
    scene.camera.position.x = 0;
    scene.camera.position.y = centerY;
    scene.camera.pitch = 0;
    scene.camera.yaw = 0;
    const aspect = scene.canvas.width / Math.max(1, scene.canvas.height);
    scene.camera.orthoScale = Math.max(height, width / aspect);
    const controls = scene.controls as { syncFromCamera?: () => void } | undefined;
    controls?.syncFromCamera?.();
}

export function motionHeading(scene: Scene, title: string, y: number) {
    const label = new SDFText(title, { fontSize: 0.58, anchor: CENTER, fill: hex('#e2e8f0') });
    label.move([0, y, 0]);
    scene.add(label);
    return label;
}

/** A caption stays readable while the world camera or simulation moves. */
export function demoCaption(scene: Scene, title: string, hint?: string, light = false) {
    const heading = new SDFText(title, {
        fontSize: 4, anchor: CENTER, fill: hex(light ? '#1e293b' : '#e2e8f0'),
    });
    heading.setAsUI().move([0, 43, 0]);
    scene.add(heading);
    const detail = hint ? new SDFText(hint, {
        fontSize: 2.2, anchor: CENTER, fill: hex(light ? '#475569' : '#94a3b8'),
    }) : undefined;
    if (detail) {
        detail.setAsUI().move([0, -44, 0]);
        scene.add(detail);
    }
    let previousAspect = 0;
    scene.always(() => {
        const aspect = scene.canvas.width / Math.max(1, scene.canvas.height);
        if (aspect === previousAspect) return;
        previousAspect = aspect;
        // Measure the actual glyphs rather than assuming a fixed character width.
        for (const label of [heading, detail]) {
            if (!label) continue;
            label.setScale(1);
            const box = label.getBoundingBox(true);
            const width = box.max.x - box.min.x;
            label.setScale(Math.min(1, (aspect * 88) / Math.max(width, 1)));
        }
    }, { phase: 'pre' });
    return heading;
}

/** Preserve the authored horizontal field of view on tall canvases. */
export function framePerspective(scene: Scene) {
    const fov = scene.camera.fov;
    let previousAspect = 0;
    scene.always(() => {
        const aspect = scene.canvas.width / Math.max(1, scene.canvas.height);
        if (aspect === previousAspect) return;
        previousAspect = aspect;
        scene.camera.fov = 2 * Math.atan(Math.tan(fov / 2) * Math.max(1, (16 / 9) / aspect));
    }, { phase: 'pre' });
}

/** Keep optional controls available without obscuring the demonstration. */
export function compactDemoPanel(container: HTMLElement, title: string) {
    Object.assign(container.style, {
        position: 'fixed', top: 'auto', bottom: '12px', left: '12px',
        width: 'min(360px, calc(100vw - 24px))', boxSizing: 'border-box',
        maxHeight: 'calc(100vh - 128px)', overflow: 'auto', padding: '12px 16px',
        lineHeight: '1.5',
    });
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = title;
    Object.assign(summary.style, { cursor: 'pointer', color: '#e2e8f0', fontWeight: '600', fontSize: '13px' });
    summary.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        details.open = !details.open;
    });
    for (const event of ['pointerdown', 'pointermove', 'pointerup', 'keydown']) {
        container.addEventListener(event, (input) => input.stopPropagation());
    }
    const content = document.createElement('div');
    content.style.paddingTop = '16px';
    while (container.firstChild) content.appendChild(container.firstChild);
    details.append(summary, content);
    container.appendChild(details);
}
