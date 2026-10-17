import { CameraModel, Scene, hex } from 'retiam';
import { Automaton, Tape, AutomatonRunner } from 'retiam/graphs';

/** The parity automaton processes 10x and displays the resulting verdict. */
export default class AutomatonMissingScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const machine = new Automaton();
        machine.addState('even', { isStart: true, isAccepting: true, label: 'even' });
        machine.addState('odd', { label: 'odd' });
        machine.addTransition('even', 'even', '0'); machine.addTransition('odd', 'odd', '0');
        machine.addTransition('even', 'odd', '1'); machine.addTransition('odd', 'even', '1');
        machine.getNode('even')!.move([-2, 0.7, 0]); machine.getNode('odd')!.move([2, 0.7, 0]);
        const tape = new Tape({ symbols: '10x', cellSize: 0.65 }).move([0, -1.5, 0]);
        const runner = new AutomatonRunner(machine, tape, { verdictPosition: [0, -2.5, 0] });
        this.add(machine, tape, runner);
        this.camera.frame([machine, tape, runner], { padding: 0.4 });
        await runner.run(this, '10x', 0.65);
    await this.wait(1700);
  }
}
