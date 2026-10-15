import { frameStage, demoCaption } from "../../shared/presentation";


import { Circle, Text, Mask, Scene, Color, Sprite, SDFText, CENTER, RED } from "retiam";


export default class MaskScene extends Scene{
    public async run(): Promise<void> {
        frameStage(this, 125, 86);
        demoCaption(this, "Animated text mask", "Live video clipped by changing letterforms");
        const maskShape = new Text("Hello", {fontSize: 35, position: [0,0], anchor: CENTER});
            const image = new Sprite(90, 50, "/res/media/nature.mp4");

            // The image is now perfectly clipped into a circle
            const clippedImage = new Mask(maskShape, image);

            this.add(clippedImage);
            await image.play();
            // this.add(image, maskShape);

            let circle = new Circle(20, {position: [0,0,-1], opacity: 0.6, fill: Color.fromHex("#17273c")});
            this.add(circle);
            this.always(()=>{
                maskShape.transform.setScale((Math.sin(this.time*0.0015)+1)*0.5)
            });

    }
}
