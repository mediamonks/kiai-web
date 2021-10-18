import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

const DEFAULT_CLIP_LEVEL = 1;
const DEFAULT_AVERAGING = 0.95;
const DEFAULT_THRESHOLD = 0.1;

export default class AmplitudeGate extends PipeSource implements IPipeDestination {
	private readonly clipLevel: number = DEFAULT_CLIP_LEVEL;
	private readonly averaging: number = DEFAULT_AVERAGING;
	private readonly threshold: number = DEFAULT_THRESHOLD;
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
