import { frameStage, demoCaption, compactDemoPanel } from "../../shared/presentation";
import {
    Scene,
    OrbitCameraController,
    Vec3,
    Rect,
    Circle,
    Line,
    Rate,
    hex,
    CENTER,
    RateFunc,
    Entity,
    Color,
    Camera2DController
} from "retiam";

export default class TestAnimation extends Scene{
    public constructor(){
        super();
    }

    rect: Circle;
    child: Circle;
    public async rotate(entity:Entity, lag=0){

        new Camera2DController(this, this.camera)
        await this.wait(lag * 1000);
        let time = 1000;
        let w = 40;
        while (true){
            await this.play(entity.animate.move([w,w]), {duration:time});
            await this.play(entity.animate.move([w,-w]), {duration:time});
            await this.play(entity.animate.move([-w,-w]), {duration:time});
            await this.play(entity.animate.move([-w,w]), {duration:time});
        }
    }
    public async run() {
        
        let n = 10;
        for (let i =0; i<n; i++){
            let entity: Entity = new Circle(1, {fill: Color.RED});
            entity.LABEL = "E"+i;
            this.rotate(entity, i/(n*0.8));
        }
    }
}
