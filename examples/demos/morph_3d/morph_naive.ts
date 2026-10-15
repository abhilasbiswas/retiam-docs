import { Scene } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { OrbitCameraController } from "retiam";
import { Model } from "retiam";
import { Math3D, WebGPUMesh } from "retiam";
import { Morph } from "retiam";
import { MorphMode } from "retiam";
import { Rate } from "retiam";
import { SDFText } from "retiam";
import { CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class NaiveMorphDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera & Viewport
        this.camera.position.set([0, 6, 32]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. HUD Annotations
        const title = new SDFText("Naive Linear Vertex Morph", { fontSize: 10, anchor: CENTER, position: [0, 40, 0], fill: new Color(0.3, 0.85, 1.0, 0.95), });

        title.setAsUI()
        this.add(title);


        // 3. Generate Topology-Compatible Meshes Sharing Identical Vertex/Index Layout
        const segs = 64;
        const baseRadius = 7.5;
        const sphereMesh = Math3D.createSphere(baseRadius, segs, segs);

        // Mesh A: Smooth Celestial Sphere
        const modelA = new Model(sphereMesh);
        modelA.material.color = new Color(0.1, 0.6, 1.0, 1.0); // Cyan Blue
        modelA.material.metallic = 0.85;
        modelA.material.roughness = 0.2;
        modelA.material.emColor = new Color(0.0, 0.3, 0.7, 1.0);
        modelA.material.emStrength = 0.25;

        // Mesh B: Spiked Harmonic Pulsar (Spherical Harmonics Displacement)
        const vertsB = new Float32Array(sphereMesh.vertices.length);
        for (let i = 0; i < sphereMesh.vertices.length; i += 3) {
            const x = sphereMesh.vertices[i];
            const y = sphereMesh.vertices[i + 1];
            const z = sphereMesh.vertices[i + 2];
            const len = Math.sqrt(x * x + y * y + z * z);
            const nx = x / len, ny = y / len, nz = z / len;

            // Spherical angles
            const theta = Math.atan2(nz, -nx);
            const phi = Math.acos(Math.max(-1, Math.min(1, ny)));

            // Harmonic deformation spikes
            const harmonic = Math.sin(6 * theta) * Math.pow(Math.sin(phi), 2);
            const r = baseRadius + 2.8 * harmonic;

            vertsB[i] = nx * r;
            vertsB[i + 1] = ny * r;
            vertsB[i + 2] = nz * r;
        }

        const meshB: WebGPUMesh = Math3D.computeSmoothShading(vertsB, sphereMesh.indices!, sphereMesh.uvs);
        const modelB = new Model(meshB);
        modelB.material.color = new Color(1.0, 0.15, 0.45, 1.0); // Neon Coral
        modelB.material.metallic = 0.9;
        modelB.material.roughness = 0.18;
        modelB.material.emColor = new Color(0.8, 0.05, 0.3, 1.0);
        modelB.material.emStrength = 0.3;

        // Mesh C: Longitudinal Ripple Sphere
        const vertsC = new Float32Array(sphereMesh.vertices.length);
        for (let i = 0; i < sphereMesh.vertices.length; i += 3) {
            const x = sphereMesh.vertices[i];
            const y = sphereMesh.vertices[i + 1];
            const z = sphereMesh.vertices[i + 2];
            const len = Math.sqrt(x * x + y * y + z * z);
            const nx = x / len, ny = y / len, nz = z / len;

            const ripple = Math.sin(ny * 6.0) * 1.8;
            const r = baseRadius + ripple;

            vertsC[i] = nx * r;
            vertsC[i + 1] = ny * r;
            vertsC[i + 2] = nz * r;
        }

        const meshC: WebGPUMesh = Math3D.computeSmoothShading(vertsC, sphereMesh.indices!, sphereMesh.uvs);
        const modelC = new Model(meshC);
        modelC.material.color = new Color(0.95, 0.8, 0.1, 1.0); // Electric Gold
        modelC.material.metallic = 0.95;
        modelC.material.roughness = 0.15;
        modelC.material.emColor = new Color(0.6, 0.4, 0.0, 1.0);
        modelC.material.emStrength = 0.2;

        this.add(modelA);

        // Keep models spinning in unison
        this.always(() => {
            const rotY = this.dt * 0.0006;
            const rotX = this.dt * 0.00025;
            modelA.transform.rotateWorldY(rotY);
            modelA.transform.rotateWorldX(rotX);
            modelB.transform.rotateWorldY(rotY);
            modelB.transform.rotateWorldX(rotX);
            modelC.transform.rotateWorldY(rotY);
            modelC.transform.rotateWorldX(rotX);
            this.invalidate();
        });

        const naiveConfig = {
            mode: MorphMode.NAIVE,
            duration: 2500,
            rate_func: Rate.easeInOutCubic()
        };

        // 4. Ultra-Smooth Blendshape Morph Loop
        while (true) {
            await this.wait(1000);

            // Smooth Sphere -> Spiked Harmonic Pulsar
            await this.play(Morph(modelA, modelB, naiveConfig));
            await this.wait(1000);

            // Spiked Pulsar -> Longitudinal Ripple Sphere
            await this.play(Morph(modelB, modelC, naiveConfig));
            await this.wait(1000);

            // Ripple Sphere -> Smooth Sphere
            await this.play(Morph(modelC, modelA, naiveConfig));
        }
    }
}
