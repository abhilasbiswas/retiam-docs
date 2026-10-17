import { CENTER, CameraModel, Circle, InteractionManager, Rect, SDFText, Scene, hex } from 'retiam';

/** The engine recorder captures a real drag; stopping downloads the normalized input JSON. */
export default class InputRecordScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    new InteractionManager(this);
    const dot=new Circle(0.45,{fill:hex('#38bdf8')});dot.setDraggable(true);
    const control=new Rect(3.8,0.65,{fill:hex('#1e293b')}).move([0,1.8,0]);
    const label=new SDFText('Click to record',{fontSize:0.3,anchor:CENTER}).move([0,1.8,0]);this.add(dot,control,label);
    let recording=false;control.setEvent('click',()=>{recording=!recording;if(recording){this.composer!.recorder.startRecording();label.setText('Drag, then click to save JSON');}else{this.composer!.recorder.stopRecording();label.setText('Saved · click to record again');}this.invalidate();});await this.wait(8000);
  }
}
