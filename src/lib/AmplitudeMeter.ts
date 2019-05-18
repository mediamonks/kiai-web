import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

export default class AmplitudeMeter extends PipeSource implements IPipeDestination {
  public receive(audio: Float32Array): void {
    this.publish({ audio, amplitude: AmplitudeMeter.calculateAmplitude(audio) });
  }

  private static calculateAmplitude(audio: Float32Array) {
    const sum = audio.reduce((sum, value) => sum + value * value);

    return Math.sqrt(sum / audio.length);
  }
}
