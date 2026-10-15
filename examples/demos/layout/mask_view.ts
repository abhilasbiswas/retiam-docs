import { frameStage, demoCaption } from "../../shared/presentation";


import { Circle, Text, Mask, Scene, Sprite, SDFText, CENTER, orbitCameraController, BLACK } from "retiam";


export default class MaskScene extends Scene {
    public async run(): Promise<void> {
        frameStage(this, 30, 22);
        demoCaption(this, "Video inside typography", "A live texture reveals the letter contours");

        // this.ALWAYS_UPDATE = true;
        const maskShape = new Text("Nature", { fontSize: 6.5, position: [0, 0], anchor: CENTER });
        const image = new Sprite(26, 14.625, "/res/media/nature.mp4");
        this.camera.position = [0, 0, 20]
        orbitCameraController(this, this.camera)
        // The image is now perfectly clipped into a circle
        const clippedImage = new Mask(maskShape, image);

        this.add(clippedImage);
        await image.play();
        // this.add(image, maskShape);

        let circle = new Circle(20, { position: [0, -21], opacity: 1.0 });
        // this.add(circle)
        this.always(() => {
            // maskShape.transform.setScale((Math.sin(this.time*0.0015)+1.5)*0.5)
        })


    }
}
