/*
	Takes a value (frequency or amplitude) and publishes true or false whenever it remains above or below a certain threshold for a given amount of time
 */
import PipeSource from './PipeSource';
import { IPipeDestination } from './types';

type TSignalTriggerOptions = {
	threshold?: number;
	delay?: number;
};

export default class SignalTrigger extends PipeSource implements IPipeDestination {
	private timer: number;
	private state: boolean;
	protected readonly defaultOptions: TSignalTriggerOptions = {
		threshold: 0.2,
		delay: 500,
	};

	public receive(value: number): void {
		const { threshold, delay } = this.options as TSignalTriggerOptions;

		const state = value > threshold;

		if (state === this.state) return;

		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		this.timer = window.setTimeout(() => {
			this.publish(this.state);
			this.timer = null;
		}, delay);

		this.state = state;
	}
}
