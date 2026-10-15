import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Color, DOWN, Entity, Math3D, Model, OrbitCameraController, SDFText, Scene, TracePath, UP, Vec3 } from "retiam";

export default class BillboardDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 15, 45]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Billboards in orbit", "Labels face the camera as their planets move");

        // ==========================================
        // 1. SUN SYSTEM
        // ==========================================
        const sunSystem = new Entity(); // Container
        this.add(sunSystem);

        const sunMesh = Math3D.computeSmoothShading(
            Math3D.createSphere(4, 64, 64).vertices,
            Math3D.createSphere(4, 64, 64).indices!
        );
        const sun = new Model(sunMesh);
        sun.material.color = new Color(1.0, 0.8, 0.1, 1.0);
        sun.material.emColor = new Color(1.0, 0.6, 0.1, 1.0);
        sun.material.emStrength = 1.5;

        const sunLabel = new SDFText("The Sun", { fontSize: 2 });
        sunLabel.paint.fill = new Color(1.0, 0.9, 0.5, 1.0);
        sunLabel.nextTo(sun, UP, 0.5);
        sunLabel.alwaysFaceCamera(DOWN);

        // Add both to the container (Siblings)
        sunSystem.add(sun, sunLabel);


        // ==========================================
        // 2. PLANET A SYSTEM
        // ==========================================
        const planetASystem = new Entity();
        planetASystem.transform.position.set([15, 0, 0]);

        const planetAMesh = Math3D.computeSmoothShading(
            Math3D.createSphere(1.5, 32, 32).vertices,
            Math3D.createSphere(1.5, 32, 32).indices!
        );
        const planetA = new Model(planetAMesh);
        planetA.material.color = new Color(0.2, 0.6, 1.0, 1.0);
        planetA.material.roughness = 0.3;

        const planetALabel = new SDFText("Planet A", { fontSize: 2 });
        planetALabel.paint.fill = new Color(0.6, 0.8, 1.0, 1.0);
        planetALabel.nextTo(planetA, UP, 0.5);
        planetALabel.alwaysFaceCamera(DOWN);

        // Add both to the container (Siblings)
        planetASystem.add(planetA, planetALabel);

        const pivotA = new Entity();
        pivotA.add(planetASystem);
        this.add(pivotA);

        const orbitPathA = new TracePath({ target: planetASystem, maxAge: 8000, fadeLength: 0.8, smoothing: 3 });
        orbitPathA.paint.stroke = new Color(0.2, 0.6, 1.0, 0.5);
        orbitPathA.paint.strokeWidth = 1.5;
        this.add(orbitPathA);


        // ==========================================
        // 3. PLANET B SYSTEM (Tilted)
        // ==========================================
        const planetBSystem = new Entity();
        planetBSystem.transform.position.set([25, 0, 0]);

        const planetBMesh = Math3D.computeSmoothShading(
            Math3D.createSphere(1.0, 32, 32).vertices,
            Math3D.createSphere(1.0, 32, 32).indices!
        );
        const planetB = new Model(planetBMesh);
        planetB.material.color = new Color(1.0, 0.3, 0.4, 1.0);
        planetB.material.roughness = 0.5;

        const planetBLabel = new SDFText("Planet B", { fontSize: 2 });
        planetBLabel.paint.fill = new Color(1.0, 0.6, 0.6, 1.0);
        planetBLabel.nextTo(planetB, UP, 0.5);
        planetBLabel.alwaysFaceCamera(DOWN);

        planetBSystem.add(planetB, planetBLabel);

        const pivotB = new Entity();
        pivotB.add(planetBSystem);
        pivotB.transform.rotateWorldZ(0.3);
        this.add(pivotB);

        const orbitPathB = new TracePath({ target: planetBSystem, maxAge: 12000, fadeLength: 0.8, smoothing: 3 });
        orbitPathB.paint.stroke = new Color(1.0, 0.3, 0.4, 0.5);
        orbitPathB.paint.strokeWidth = 1.5;
        this.add(orbitPathB);


        // ==========================================
        // 4. ANIMATION LOOP
        // ==========================================
        this.always(() => {
            // 1. Orbit the containers around the sun
            pivotA.transform.rotateWorldY(this.dt * 0.001);
            pivotB.transform.rotateWorldY(this.dt * 0.0006);

            // 2. Spin the planets ONLY. The labels are siblings, so they stay perfectly still!
            planetA.transform.rotateWorldY(this.dt * 0.005);
            planetB.transform.rotateWorldX(this.dt * 0.003);
            sun.transform.rotateWorldY(this.dt * 0.002);

            this.invalidate();
        });
    }
}
