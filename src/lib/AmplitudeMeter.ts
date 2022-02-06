/*
	Takes audio data and publishes its amplitude
 */
import { IPipeDestination, TAudioData } from './types';
import PipeSource from './PipeSource';

export default class AmplitudeMeter extends PipeSource implements IPipeDestination {
	public receive({ timeDomain }: TAudioData): void {
		// calculates average amplitude of chunk
		// const sum = audio.reduce((sum, value) => sum + value * value);
		// const amplitude = Math.sqrt(sum / audio.length);

		// calculates max amplitude of chunk
		let amplitude = 0;
		timeDomain.forEach(value => {
			const absoluteValue = Math.abs(value);
			if (absoluteValue > amplitude) amplitude = absoluteValue;
		});

		this.publish(amplitude);
	}
}
