/*
	Takes a value (typically amplitude), smooths it out, clips it and zeroes it out when below a certain threshold
 */
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

type TAmplitudeGateOptions = {
	clipLevel?: number;
	averaging?: number;
	threshold?: number;
};

export default class AmplitudeGate extends PipeSource implements IPipeDestination {
	private lastAmplitude: number = 0;
	protected readonly defaultOptions: TAmplitudeGateOptions = {
		clipLevel: 1,
		averaging: 0.95,
		threshold: 0.1,
	};

	public receive(value: number): void {
		const { clipLevel, averaging, threshold } = this.options as TAmplitudeGateOptions;

		let smoothedValue = Math.max(value, this.lastAmplitude * averaging);

		this.lastAmplitude = value;

		smoothedValue = Math.min(smoothedValue, clipLevel);
		if (smoothedValue < threshold) smoothedValue = 0;

		this.publish(smoothedValue);
	}
}
