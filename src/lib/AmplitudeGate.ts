import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

export default class AmplitudeGate extends PipeSource implements IPipeDestination {
  private readonly clipLevel: number = 1;
  private readonly averaging: number = 0.95;
  private readonly threshold: number = 0.1;
  private lastAmplitude: number = 0;

  constructor({
    threshold,
    clipLevel,
    averaging,
  }: {
    threshold?: number;
    clipLevel?: number;
    averaging?: number;
  } = {}) {
    super();
    this.threshold = threshold || this.threshold;
    this.clipLevel = clipLevel || this.clipLevel;
    this.averaging = averaging || this.averaging;
  }

  public receive({ audio, amplitude }: { audio: Float32Array; amplitude: number }): void {
    let smoothedAmp = Math.max(amplitude, this.lastAmplitude * this.averaging);

    this.lastAmplitude = amplitude;

    smoothedAmp = Math.min(smoothedAmp, this.clipLevel);
    if (smoothedAmp < this.threshold) smoothedAmp = 0;

    this.publish({ audio, amplitude: smoothedAmp });
  }
}
