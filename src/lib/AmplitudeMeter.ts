import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

export default class AmplitudeMeter extends PipeSource implements IPipeDestination {
	public receive(audio: Float32Array): void {
		// const sum = audio.reduce((sum, value) => sum + value * value);
		//
		// const amplitude = Math.sqrt(sum / audio.length);

		// amplitude is doubled because original range is -127 through 127 and amplitude output should be 0 through 255
		// eslint-disable-next-line no-magic-numbers
		const amplitude = (audio.reduce((sum, value) => sum + Math.abs(value)) / audio.length) * 2;

		this.publish(amplitude || 0);
	}
}
