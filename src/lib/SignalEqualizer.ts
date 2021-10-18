import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

export default class SignalEqualizer extends PipeSource implements IPipeDestination {
	private readonly filterWidth: number = 9;
	private buffer: number[] = [];

	constructor({
		filterWidth,
	}: {
		filterWidth?: number;
	} = {}) {
		super();
		this.filterWidth = filterWidth || this.filterWidth;
	}

	public receive({ frequency }: { frequency: number }): void {
		this.buffer.push(frequency);

		if (this.buffer.length > this.filterWidth) this.buffer.shift();
		if (this.buffer.length < this.filterWidth) return;

		const average = this.buffer.reduce((sum, value) => sum + value, 0) / this.buffer.length;

		this.publish({ frequency: average });
	}
}
