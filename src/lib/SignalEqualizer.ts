/*
	Takes a value (frequency or amplitude) and smoothens it
 */
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

type TSignalEqualizerOptions = {
	filterWidth?: number;
};

export default class SignalEqualizer extends PipeSource implements IPipeDestination {
	private readonly buffer: Array<number> = [];
	protected readonly defaultOptions: TSignalEqualizerOptions = {
		filterWidth: 9,
	};

	public receive(value: number): void {
		const { filterWidth } = this.options;

		this.buffer.push(value);

		if (this.buffer.length > filterWidth) this.buffer.shift();
		if (this.buffer.length < filterWidth) return;

		const average = this.buffer.reduce((sum, val) => sum + val, 0) / this.buffer.length;

		this.publish(average);
	}
}
