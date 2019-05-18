import { IPipeDestination } from './types';
import PipeSource from './PipeSource';
// @ts-ignore
import Pitchfinder from 'pitchfinder';

const detectPitch = Pitchfinder.AMDF();

export default class PitchDetector extends PipeSource implements IPipeDestination {
  private lastFrequency: number = 0;

  public receive({ audio, amplitude }: { audio: Float32Array; amplitude: number }): void {
    if (!amplitude) return;

    const frequency = detectPitch(audio);
    if (!frequency) return;

    this.lastFrequency = frequency;

    this.publish({ frequency });
  }
}
