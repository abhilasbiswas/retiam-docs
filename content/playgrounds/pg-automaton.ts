import { Scene, CameraModel, hex } from 'retiam';
import { Automaton, CyberNeonGraphTheme } from 'retiam/graphs';

/** A two-state DFA that accepts strings ending in 1. */
export default class AutomatonExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 9;

    const dfa = new Automaton({ theme: CyberNeonGraphTheme });
    dfa.addState('0', { isStart: true, radius: 0.72, pos: [-2.5, 0, 0] });
    dfa.addState('1', { isAccepting: true, radius: 0.72, pos: [2.5, 0, 0] });
    dfa.addTransition('0', '0', '0', { loopAngle: Math.PI / 2 });
    dfa.addTransition('0', '1', '1', { curvature: 0.24 });
    dfa.addTransition('1', '0', '0', { curvature: 0.24 });
    dfa.addTransition('1', '1', '1', { loopAngle: Math.PI / 2 });

    this.add(dfa);
    this.camera.frame(dfa, { padding: 0.28 });
    await this.wait(2200);
  }
}
