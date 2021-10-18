import range from 'lodash/range';
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

export enum METHOD {
	MEAN,
	MEDIAN,
	INTERPOLATION,
	LINEAR,
}

type TMethod = METHOD;

const median = (values: number[]): number => {
	const { length } = values;
	const sortedValues = values.sort();
	return (
		(length % 2 && sortedValues[(length - 1) / 2]) ||
		(sortedValues[length / 2] + sortedValues[(length / 2) - 1]) / 2
	);
};

// const mean = (values: number[]): number =>
// values.reduce((sum, value) => sum + value, 0) / values.length;

export default class SignalSmoothener extends PipeSource implements IPipeDestination {
	private readonly windowSize: number = 16;
	private readonly method: TMethod = METHOD.MEAN;

	constructor({
		windowSize,
		method,
	}: {
		windowSize?: number;
		method?: TMethod;
	} = {}) {
		super();
		this.windowSize = windowSize || this.windowSize;
		this.method = method || this.method;
	}

	public receive(data: Float32Array): void {
		const { windowSize } = this;

		const result = data.map((value, index) => {
			const windowStart = Math.max(0, index - windowSize);
			const windowEnd = Math.min(data.length - 1, index + windowSize);
			const length = windowEnd - windowStart;

			switch (this.method) {
				default:
				/* fallthrough to default (mean) */
				case METHOD.MEAN:
					return (
						range(windowStart, windowEnd)
							.reduce((sum, position) => sum + data[position], 0) / length
					);
				case METHOD.MEDIAN:
					return median(range(windowStart, windowEnd).map(position => data[position]));
				case METHOD.INTERPOLATION:
					return (data[windowStart] + data[windowEnd]) / 2;
				case METHOD.LINEAR:
					return data[windowStart] +
						((data[windowEnd] - data[windowStart]) * (windowSize / length));
			}

			return value;
		});

		this.publish(result);
	}
}
