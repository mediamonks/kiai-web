/*
	Takes audio data and publishes its frequency
 */
import Pitchfinder from 'pitchfinder';
import { IPipeDestination, TAudioData } from './types';
import PipeSource from './PipeSource';

// eslint-disable-next-line new-cap
const detectPitch = Pitchfinder.AMDF();

export default class PitchDetector extends PipeSource implements IPipeDestination {
	// private lastFrequency: number = 0;

	public receive({ timeDomain }: TAudioData): void {
		const frequency = detectPitch(timeDomain);
		if (!frequency) return;

		// this.lastFrequency = frequency;

		this.publish(frequency);
	}
}
